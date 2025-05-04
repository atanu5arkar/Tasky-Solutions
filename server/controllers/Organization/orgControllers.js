import axios from "axios";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import OrgModel from "../../models/Organization/Org.js";
import OrgTaskModel from "../../models/Organization/OrgTask.js";
import MemberModel from "../../models/Organization/Member.js";
import { cancelOrgReminders, scheduleOrgReminders } from "../../utils/orgScheduler.js";

const { MICRO_SERVICE, API_KEY } = process.env;

const myAxios = axios.create({
    baseURL: MICRO_SERVICE,
    headers: { auth: API_KEY }
});

/* 
    @route: /api/org/signup
    @method: POST
    @body: { fname, email, phone, password, confirmPassword }
*/
async function orgSignupController(req, res) {
    try {
        let { name, email, phone, password } = req.body;

        // Emails are kept unique
        const org = await OrgModel.findOne({ email });
        if (org)
            return res.status(409).json({ msg: 'Organization is already Registered!' });

        password = await bcrypt.hash(password, 10);
        await new OrgModel({ name, email, phone, password }).save();

        await myAxios.post('/send-links', { name, email, phone, type: 'org' });
        return res.status(201).json({ msg: 'Organization Registered Successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/org/verify-links
    @method: GET
*/
async function orgVerificationController(req, res) {
    try {
        const { email, phone, token } = req.query;

        // Handle already verified
        const org = await OrgModel.findOne({ email });

        if (email && phone && org?.isVerified.phone)
            return res.status(409).json({ msg: `Verified Already` });

        if (email && !phone && org?.isVerified.email)
            return res.status(409).json({ msg: `Verified Already` });

        // Otherwise hit the microservice
        const response = await myAxios.post('/verify-links', { email, phone, token, type: 'org' });
        const { msg } = response.data;

        if (msg == 'Email')
            await OrgModel.updateOne({ email }, { $set: { 'isVerified.email': true } });
        else
            await OrgModel.updateOne({ email }, { $set: { 'isVerified.phone': true } });

        return res.status(200).json({ msg: 'Verification Successful' });

    } catch (error) {
        if (error.status == 400)
            return res.status(400).json({ msg: 'Link is Invalid or Expired!' });

        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/org/login
    @method: POST
    @body: { email, password }
*/
async function orgLoginController(req, res) {
    try {
        const { email, password } = req.body;
        const org = await OrgModel.findOne({ email });

        if (!org)
            return res.status(401).json({ msg: 'Invalid Credentials!' });

        const isPassValid = await bcrypt.compare(password, org.password);

        if (!isPassValid)
            return res.status(401).json({ msg: 'Invalid Credentials!' });

        if (!org.isActive)
            return res.status(401).json({ msg: 'Your Account has been Suspended!' });

        const { _id: orgId, name, phone, isVerified } = org;

        if (!isVerified.email || !isVerified.phone)
            return res.status(401).json({ msg: 'Please verify your Email and Phone!' });

        await myAxios.post('/send-otp', { email, phone, type: 'org' });
        return res.status(200).json({ name, orgId, phone });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/org/verify-otp
    @method: POST
    @body: { email, otp }
*/
async function orgTwoFactorAuthController(req, res) {
    try {
        const { email, otp, name, phone, orgId } = req.body;
        await myAxios.post('/verify-otp', { email, otp, type: 'org' });

        const payload = { name, email, phone, orgId, type: "org" };
        const token = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: '24h' });

        return res.status(200).json({ msg: 'Logged In Successfully', token });

    } catch (error) {
        if (error.status == 400) {
            const { msg } = error.response.data;

            if (msg == 'Expired')
                return res.status(401).json({ msg });

            return res.status(401).json({ msg: 'Invalid OTP!' });
        }
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function fetchOrgProfile(req, res) {
    try {
        const { orgId } = req.org;
        let org = await OrgModel.findById(orgId, '-password');
        org = org.toObject();
        return res.status(200).json(org);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function updateOrgProfile(req, res) {
    try {
        let { newPhone, newEmail } = req.body;
        const { email, phone } = req.org;

        let org, msg = {};

        if (newEmail) {
            org = await OrgModel.findOne({ email: newEmail });
            org && (msg.newEmail = "This email is already taken.");
        }
        else {
            org = await OrgModel.findOne({ email, phone: newPhone });
            org && (msg.newPhone = "The number is already in use.");
        }

        if (Object.keys(msg).length)
            return res.status(409).json(msg);

        await myAxios.post('/cred-update', { email, newEmail, newPhone, type: "org" });
        return res.status(200).json({ [newEmail ? "newEmail" : "newPhone"]: 'OTP Sent.' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function verifyUpdateOTP(req, res) {
    try {
        const { otp, newEmail, newPhone } = req.body;
        const { email, orgId, phone } = req.org;

        const response = await myAxios.post('/cred-update/verify', { email, newEmail, newPhone, otp, type: "org" });
        const { msg } = response.data;

        // Valid OTP: DB update. Reset alerts for email update only.

        if (msg == "Email") {
            await OrgModel.updateOne({ _id: orgId }, { $set: { email: newEmail } });

            const tasks = await OrgTaskModel.find({
                organization: orgId,
                status: false,
                deadline: {
                    $gt: new Date()
                },
                team: {
                    $ne: null
                }
            });

            for (const taskDoc of tasks) {
                const teamDoc = await TeamModel.findOne({ _id: taskDoc.team }).populate("members");
                teamDoc.members.forEach(mem => cancelOrgReminders(taskDoc._id, email, mem._id));

                const { _id: taskid, task, deadline, reminders, alertType } = taskDoc;
                scheduleOrgReminders({
                    _id: orgId,
                    taskId: taskid,
                    task,
                    deadline,
                    dateArr: reminders,
                    alertType,
                    orgEmail,
                    members: teamDoc.members,
                });
            }
        } else await OrgModel.updateOne({ _id: orgId }, { $set: { phone: newPhone } });

        return res.status(200).json({ msg: "Profile updated successfully" });

    } catch (error) {
        if (error.status == 400) {
            const { msg } = error.response.data;

            if (msg == 'Expired')
                return res.status(400).json({ msg: "OTP is expired." });

            return res.status(400).json({ msg: 'Invalid OTP.' });
        }
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function fetchAllMembers(req, res) {
    try {
        const { orgId } = req.org;
        let members = await MemberModel.find({ organization: orgId });
        members = members.map(memDoc => memDoc.toObject());
        return res.status(200).json(members);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/org/member-invite
    @method: POST
    @body: { name, email, phone }
*/
async function memberInviteController(req, res) {
    try {
        const { name, email, phone } = req.body;
        const { name: orgName, orgId } = req.org;

        const member = await MemberModel.findOne({ email, organization: orgId });
        if (member)
            return res.status(409).json({ msg: 'Member invited already!' });

        await myAxios.post('/send-invite', { email, phone, orgName, orgId });
        await new MemberModel({ organization: orgId, name, email, phone }).save();
        return res.status(200).json({ msg: 'Invitation Sent' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/org/member/verify-links
    @method: GET
    @query: { email, phone, token }
*/
async function verifyInviteController(req, res) {
    try {
        const { email, phone, token } = req.query;

        // Handle already verified
        const member = await MemberModel.findOne({ email });

        if (email && phone && member?.isVerified.phone)
            return res.status(409).json({ msg: `Verified Already` });

        if (email && !phone && member?.isVerified.email)
            return res.status(409).json({ msg: `Verified Already` });

        // Otherwise hit the microservice
        const response = await myAxios.post('/verify-invite', { email, phone, token });
        const { msg } = response.data;

        if (msg == 'Email')
            await MemberModel.updateOne({ email, organization: token }, {
                $set: {
                    'isVerified.email': true
                }
            });
        else
            await MemberModel.updateOne({ email, organization: token }, {
                $set: {
                    'isVerified.phone': true
                }
            });
        return res.status(200).json({ msg: 'Verification Successful' });

    } catch (error) {
        if (error.status == 400)
            return res.status(400).json({ msg: 'Link is Invalid or Expired!' });

        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/org/tasks
    @method: GET
*/
async function getOrgTasksCountController(req, res) {
    try {
        const { orgId } = req.org;
        const result = await OrgTaskModel.aggregate([
            {
                $match: {
                    organization: Types.ObjectId.createFromHexString(orgId)
                }
            },
            {
                $count: 'scheduledTasks'
            }
        ]);

        return res.status(200).json(result);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/org/alerts
    @method: GET
*/
async function getOrgAlertsCountController(req, res) {
    try {
        const { orgId } = req.org;
        const { alerts } = await OrgModel.findOne({ _id: orgId });
        return res.status(200).json({ alerts });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/org/filter-alerts
    @method: GET
    @query: from, to (GMT date strings)
*/
async function filterOrgAlertsController(req, res) {
    try {
        const { orgId } = req.org;
        const { from, to } = req.query;

        const startDate = new Date(from);
        const endDate = new Date(to);
        const midnight = [0, 0, 0, 0];

        startDate.setUTCHours(...midnight);

        endDate.setUTCHours(...midnight);
        endDate.setUTCDate(endDate.getUTCDate() + 1);

        const result = await OrgModel.aggregate([
            {
                $match: {
                    _id: Types.ObjectId.createFromHexString(orgId)
                }
            },
            {
                $project: {
                    alertDates: {
                        $filter: {
                            input: '$alertDates',
                            as: 'date',
                            cond: {
                                $and: [
                                    {
                                        $gte: ['$$date', startDate]
                                    },
                                    {
                                        $lt: ['$$date', endDate]
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        ]);
        return res.status(200).json(result);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

export {
    orgSignupController,
    orgVerificationController,
    orgLoginController,
    orgTwoFactorAuthController,
    fetchOrgProfile,
    updateOrgProfile,
    verifyUpdateOTP,
    fetchAllMembers,
    memberInviteController,
    verifyInviteController,
    getOrgTasksCountController,
    getOrgAlertsCountController,
    filterOrgAlertsController
};