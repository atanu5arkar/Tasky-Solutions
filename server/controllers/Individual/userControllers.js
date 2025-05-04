import axios from "axios";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import UserModel from "../../models/Individual/User.js";
import TaskModel from "../../models/Individual/Task.js";
import { scheduleReminders, cancelReminders } from "../../utils/userScheduler.js";

const { MICRO_SERVICE, API_KEY } = process.env;

const myAxios = axios.create({
    baseURL: MICRO_SERVICE,
    headers: { auth: API_KEY }
});

/* 
    @route: /api/user/signup
    @method: POST
    @body: { fname, email, phone, password, confirmPassword }
*/
async function signupController(req, res) {
    try {
        let { name, email, phone, password } = req.body;

        // Emails are kept unique
        const user = await UserModel.findOne({ email });
        if (user)
            return res.status(409).json({ msg: 'User is already Registered!' });

        password = await bcrypt.hash(password, 10);
        await new UserModel({ name, email, phone, password }).save();

        await myAxios.post('/send-links', { name, email, phone });
        return res.status(201).json({ msg: 'User Registered Successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/user/verify-links
    @method: GET
*/
async function verificationController(req, res) {
    try {
        const { email, phone, token } = req.query;

        // Handle already verified
        const user = await UserModel.findOne({ email });

        if (email && phone && user?.isVerified.phone)
            return res.status(409).json({ msg: `Verified Already` });

        if (email && !phone && user?.isVerified.email)
            return res.status(409).json({ msg: `Verified Already` });

        // Otherwise hit the microservice
        const response = await myAxios.post('/verify-links', { email, phone, token });
        const { msg } = response.data;

        if (msg == 'Email')
            await UserModel.updateOne({ email }, { $set: { 'isVerified.email': true } });
        else
            await UserModel.updateOne({ email }, { $set: { 'isVerified.phone': true } });

        return res.status(200).json({ msg: 'Verification Successful' });

    } catch (error) {
        if (error.status == 400)
            return res.status(400).json({ msg: 'Link is Invalid or Expired!' });

        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/user/login
    @method: POST
    @body: { email, password }
*/
async function loginController(req, res) {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user)
            return res.status(401).json({ msg: 'Invalid Credentials.' });

        const isPassValid = await bcrypt.compare(password, user.password);

        if (!isPassValid)
            return res.status(401).json({ msg: 'Invalid Credentials!' });

        if (!user.isActive)
            return res.status(401).json({ msg: 'Your Account has been Suspended.' });

        const { _id: userId, name, phone, isVerified } = user;

        if (!isVerified.email || !isVerified.phone)
            return res.status(401).json({ msg: 'Please verify your Email and Phone.' });

        await myAxios.post('/send-otp', { email, phone });
        return res.status(200).json({ name, userId, phone });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/user/verify-otp
    @method: POST
    @body: { email, otp }
*/
async function twoFactorAuthController(req, res) {
    try {
        const { email, otp, name, phone, userId } = req.body;
        await myAxios.post('/verify-otp', { email, otp });

        const payload = { name, email, phone, userId, type: "user" };
        const token = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: '24h' });

        return res.status(200).json({ msg: 'Logged In Successfully', token });

    } catch (error) {
        if (error.status == 400) {
            const { msg } = error.response.data;

            if (msg == 'Expired')
                return res.status(401).json({ msg });

            return res.status(401).json({ msg: 'Invalid OTP.' });
        }
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/user/profile
    @method: GET
*/
async function fetchUserProfile(req, res) {
    try {
        const { userId } = req.user;
        const user = await UserModel.findById(userId, '-password -alertDates');
        return res.status(200).json(user);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function updateUserProfile(req, res) {
    try {
        let { newPhone, newEmail } = req.body;
        const { email, phone } = req.user;

        let user, msg = {};

        if (newEmail) {
            user = await UserModel.findOne({ email: newEmail });
            user && (msg.newEmail = "This email is already taken.");
        }
        else {
            user = await UserModel.findOne({ email, phone: newPhone });
            user && (msg.newPhone = "The number is already in use.");
        }

        if (Object.keys(msg).length)
            return res.status(409).json(msg);

        await myAxios.post('/cred-update', { email, newEmail, newPhone });
        return res.status(200).json({ [newEmail ? "newEmail" : "newPhone"]: 'OTP Sent.' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function verifyUpdateOTP(req, res) {
    try {
        const { otp, newEmail, newPhone } = req.body;
        const { email, userId, phone } = req.user;

        const response = await myAxios.post('/cred-update/verify', { email, newEmail, newPhone, otp });
        const { msg } = response.data;

        // For a valid OTP, the alerts must be reset along with DB update

        if (msg == "Email") {
            await UserModel.updateOne({ _id: userId }, { $set: { email: newEmail } });
            const tasks = await TaskModel.find({
                user: userId,
                status: false,
                $or: [
                    { alertType: "email" },
                    { alertType: "both" }
                ]
            });
            tasks.forEach(taskDoc => {
                const { task, deadline, reminders, alertType } = taskDoc;
                
                cancelReminders(taskDoc._id, email);
                scheduleReminders({
                    _id: userId,
                    task,
                    deadline,
                    taskId: taskDoc._id,
                    dateArr: reminders,
                    alertType,
                    phone,
                    email: newEmail
                });
            });
        } 
        else {
            await UserModel.updateOne({ _id: userId }, { $set: { phone: newPhone } });
            const tasks = await TaskModel.find({
                user: userId,
                status: false,
                $or: [
                    { alertType: "sms" },
                    { alertType: "both" }
                ]
            });
            tasks.forEach(taskDoc => {
                const { task, deadline, reminders, alertType } = taskDoc;
                
                cancelReminders(taskDoc._id, email);
                scheduleReminders({
                    _id: userId,
                    task,
                    deadline,
                    taskId: taskDoc._id,
                    dateArr: reminders,
                    alertType,
                    phone: newPhone,
                    email,
                });
            });
        }
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

/* 
    @route: /api/user/scheduled-tasks
    @method: GET
*/
async function getScheduledTasksController(req, res) {
    try {
        const { userId } = req.user;
        const result = await TaskModel.aggregate([
            {
                $match: {
                    user: Types.ObjectId.createFromHexString(userId)
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
    @route: /api/user/alerts
    @method: GET
*/
async function getAlertsController(req, res) {
    try {
        const { userId } = req.user;
        const { alerts } = await UserModel.findOne({ _id: userId });
        return res.status(200).json({ alerts });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/user/filter-alerts
    @method: GET
    @query: from, to (GMT date strings)
*/
async function filterAlertsController(req, res) {
    try {
        const { userId } = req.user;
        const { from, to } = req.query;

        const startDate = new Date(from);
        const endDate = new Date(to);

        const midnight = [0, 0, 0, 0];

        startDate.setUTCHours(...midnight);

        endDate.setUTCHours(...midnight);
        endDate.setUTCDate(endDate.getUTCDate() + 1);

        const result = await UserModel.aggregate([
            {
                $match: {
                    _id: Types.ObjectId.createFromHexString(userId)
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
    signupController,
    verificationController,
    loginController,
    twoFactorAuthController,
    fetchUserProfile,
    updateUserProfile,
    verifyUpdateOTP,
    getScheduledTasksController,
    getAlertsController,
    filterAlertsController
};