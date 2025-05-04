import ejs from "ejs";

import redisClient from "./redisClient.js";
import sendEmail from "./sendMail.js";
import sendSMS from "./sendSMS.js";

function getRandString(size) {
    const chars = 'A0B1C2D3E4FGHIJKLMNOPQRSTUVWXYZa5b6c7d8e9fghijklmnopqrstuvwxyz';
    let result = '';

    while (result.length < size) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

function generateOTP(size) {
    let otp = '';

    while (otp.length != size) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
}

async function sendVerificationLinks(name, email, phone, type) {
    try {
        const { MAIN_SERVER } = process.env;
        const token = getRandString(16);
        const uniqueKey = type ?? 'user';

        const emailBody = await ejs.renderFile("templates/emailVerify.ejs", {
            href: `${MAIN_SERVER}/verify-links/${uniqueKey}?email=${email}&token=${token}`
        });

        // Proper URL encoded query param
        const phoneParam = new URLSearchParams();
        phoneParam.append("phone", phone);

        /* 
         * The uniqueKey variable makes the Redis keys "unique". 
         * Its value is so that the client can hit the correct endpoint for verification.
         * If needed, it can be helpful in switching email templates based on userType.
        */
        await redisClient.set(`${email}${uniqueKey}`, token, { EX: 60 * 60 * 2 });
        await redisClient.set(`${email}${phone}${uniqueKey}`, token, { EX: 60 * 60 * 2 });

        await sendEmail({
            email,
            subject: 'Email Verification Link for Tasky.',
            body: emailBody
        });

//         return await sendSMS({
//             phone,
//             body: `
//             Hey! Tap the link below to verify the phone no. for your Tasky Account: 
// ${MAIN_SERVER}/${uniqueKey}/verify-links?email=${email}&${phoneParam}&token=${token}`
//         });
    } catch (error) {
        console.log(error);
    }
}

async function sendOTP(email, phone, type) {
    try {
        const otp = generateOTP(6);

        // type parameter is to prevent Redis keys clash.
        await redisClient.set(`${email}${type ?? 'user'}`, otp, { EX: 60 * 10 });
        console.log(otp);

        // return await sendSMS({
        //     phone,
        //     body: `Your Tasky Login OTP is ${otp}. Valid for 10 mins only.`
        // });
    } catch (error) {
        console.log(error);
    }
}

async function sendSMSReminder(phone, msgData) {
    try {
        const { task, deadline, count } = msgData;

        return await sendSMS({
            phone,
            body: `Reminder${count} for your task: "${task}" to be completed by ${deadline}.`
        });
    } catch (error) {
        console.log(error);
    }
}

async function sendEmailReminder(email, msgData) {
    try {
        const { task, deadline, count } = msgData;

        return await sendEmail({
            email,
            subject: `Tasky Reminder`,
            body: `Reminder${count} for your task: "${task}" to be completed by ${deadline}.`
        });
    } catch (error) {
        console.log(error);
    }
}

async function sendInvite(data) {
    try {
        const { name, email, phone, orgName, orgId } = data;
        const { MAIN_SERVER } = process.env;
        
        const phoneParam = new URLSearchParams();
        phoneParam.append("phone", phone);

        await redisClient.set(`${email}-mem`, orgId, { EX: 60 * 60 * 2 });
        await redisClient.set(`${email}${phone}-mem`, orgId, { EX: 60 * 60 * 2 });

        const emailBody = await ejs.renderFile("templates/memberInvite.ejs", {
            href: `${MAIN_SERVER}/verify-links/member?email=${email}&token=${orgId}`,
            orgName
        });

        await sendEmail({
            email,
            subject: `Tasky Invitation`,
            body: emailBody
        });

        return await sendSMS({
            phone,
            body: `
            ${orgName} invites you to join Tasky. Hit the link below to verify your phone no.:  
${MAIN_SERVER}/verify-links/member?email=${email}&${phoneParam}&token=${orgId} 

We're ready with your deadlines :)`
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

export {
    sendVerificationLinks,
    sendOTP,
    sendSMSReminder,
    sendEmailReminder,
    sendInvite,
    generateOTP
};