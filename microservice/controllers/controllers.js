import ejs from "ejs";
import { formatInTimeZone } from "date-fns-tz";

import redisClient from "../utils/redisClient.js";
import sendEmail from "../utils/sendMail.js";
import sendSMS from "../utils/sendSMS.js";
import {
    sendVerificationLinks,
    sendOTP,
    sendInvite,
    sendEmailReminder,
    sendSMSReminder,
    generateOTP,
} from "../utils/helpers.js";

async function sendLinksController(req, res) {
    try {
        const { name, email, phone, type } = req.body;
        await sendVerificationLinks(name, email, phone, type);
        return res.status(200).json({ msg: 'Links sent' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function verifyLinksController(req, res) {
    try {
        const { email, phone, token, type } = req.body;
        let dbValue;

        // Its purpose is mentioned in sendVerificationLinks helper fn defn.
        const uniqueKey = type ?? 'user';

        if (email && phone) {
            dbValue = await redisClient.get(`${email}${phone}${uniqueKey}`);
            if (dbValue == token) return res.status(200).json({ msg: 'Phone' });
        }
        else if (email) {
            dbValue = await redisClient.get(`${email}${uniqueKey}`);
            if (dbValue == token) return res.status(200).json({ msg: 'Email' });
        }

        return res.status(400).json({ msg: 'Bad Request!' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function sendOTPController(req, res) {
    try {
        const { email, phone, type } = req.body;
        await sendOTP(email, phone, type);
        return res.status(200).json({ msg: 'OTP Sent' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function verifyOTPController(req, res) {
    try {
        const { email, otp, type } = req.body;
        const dbValue = await redisClient.get(`${email}${type ?? 'user'}`);

        if (!dbValue)
            return res.status(400).json({ msg: 'Expired!' });
        if (dbValue != otp)
            return res.status(400).json({ msg: 'Invalid!' });

        return res.status(200).json({ msg: 'OK' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function credUpdateController(req, res) {
    try {
        let { email, newEmail, newPhone, type } = req.body;
        
        const otp = generateOTP(6);
        type = type ?? "user";

        if (newEmail) {
            await redisClient.set(`${newEmail}${type}`, otp, { EX: 60 * 10 });
            const emailBody = await ejs.renderFile("./templates/updateEmail.ejs", { otp });
            await sendEmail({
                email: newEmail,
                subject: 'Update your Tasky profile',
                body: emailBody
            });
        } else {
            await redisClient.set(`${email}${newPhone}${type}`, otp, { EX: 60 * 10 });
            await sendSMS({
                phone: newPhone,
                body: `To update your profile, use the OTP ${otp}. Valid for 10 mins only.`
            });
        }
        return res.status(200).json({msg: "OTP Sent"});
         
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function verifyUpdateOTPController(req, res) {
    try {
        const { email, otp, newEmail, newPhone, type } = req.body;
        let dbValue;
        
        if (newEmail) {
            dbValue = await redisClient.get(`${newEmail}${type ?? 'user'}`);
            if (dbValue == otp) return res.status(200).json({ msg: 'Email' });
        }
        else {
            dbValue = await redisClient.get(`${email}${newPhone}${type ?? 'user'}`);
            if (dbValue == otp) return res.status(200).json({ msg: 'Phone' });
        }

        if (!dbValue) return res.status(400).json({ msg: 'Expired!' });
        return res.status(400).json({ msg: 'Invalid OTP!' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function sendInviteController(req, res) {
    try {
        const { name, email, phone, orgName, orgId } = req.body;
        await sendInvite({
            name,
            email,
            phone,
            orgName,
            orgId
        });
        return res.status(200).json({ msg: 'OK' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function verifyInviteController(req, res) {
    try {
        const { email, phone, token } = req.body;
        
        let dbValue;

        if (email && phone) {
            dbValue = await redisClient.get(`${email}${phone}-mem`);
            if (dbValue == token) return res.status(200).json({ msg: 'Phone' });
        }
        else if (email) {
            dbValue = await redisClient.get(`${email}-mem`);
            if (dbValue == token) return res.status(200).json({ msg: 'Email' });
        }
        return res.status(400).json({ msg: 'Bad Request!' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function sendReminderController(req, res) {
    try {
        let { task, deadline, email, phone, alertType, count } = req.body;
        deadline = formatInTimeZone(deadline, "Asia/Kolkata", "dd MMM yyyy, hh:mm a");
        
        const msgData = { task, deadline, count };

        if (alertType == 'email')
            await sendEmailReminder(email, msgData);
        else if (alertType == 'sms')
            await sendSMSReminder(phone, msgData);
        else {
            await sendEmailReminder(email, msgData);
            await sendSMSReminder(phone, msgData);
        }
        return res.status(200).json({ msg: 'OK' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

export {
    sendLinksController,
    verifyLinksController,
    sendOTPController,
    verifyOTPController,
    credUpdateController,
    verifyUpdateOTPController,
    sendInviteController,
    verifyInviteController,
    sendReminderController
};