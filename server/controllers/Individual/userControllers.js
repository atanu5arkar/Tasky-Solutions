import axios from "axios";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../../utils/connectPostgres.js";

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
        const dbRes = await pool.query(`
            SELECT email FROM users
            WHERE email = $1;    
        `, [email]);

        if (dbRes.rowCount)
            return res.status(409).json({ msg: 'User is already Registered!' });

        password = await bcrypt.hash(password, 10);

        await pool.query(`
            INSERT INTO users (name, email, phone, password)
            VALUES ($1, $2, $3, $4);
        `, [name, email, phone, password]);

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
        const { rows } = await pool.query(`
            SELECT is_email_verified, is_phone_verified FROM users
            WHERE email = $1;    
        `, [email]);

        if (email && phone && rows[0]?.is_phone_verified)
            return res.status(409).json({ msg: `Verified Already` });

        if (email && !phone && rows[0]?.is_email_verified)
            return res.status(409).json({ msg: `Verified Already` });

        // Otherwise hit the microservice
        const response = await myAxios.post('/verify-links', { email, phone, token });
        const { msg } = response.data;

        if (msg == 'Email')
            await pool.query(`
                UPDATE users
                SET is_email_verified = true
                WHERE email = $1;
            `, [email]);
        else
            await pool.query(`
                UPDATE users
                SET is_phone_verified = true
                WHERE email = $1;
            `, [email]);

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

        const { rows } = await pool.query(`
            SELECT * FROM users
            WHERE email = $1;    
        `, [email]);

        if (!rows.length)
            return res.status(401).json({ msg: 'Invalid Credentials.' });

        const {
            _id: userId,
            password: hash,
            name,
            phone,
            is_email_verified,
            is_phone_verified
        } = rows[0];

        const isPassValid = await bcrypt.compare(password, hash);

        if (!isPassValid)
            return res.status(401).json({ msg: 'Invalid Credentials!' });

        if (!is_email_verified || !is_phone_verified)
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
        const { rows } = await pool.query(`
            SELECT name, email, phone, email_credits, sms_credits, alerts 
            FROM users
            WHERE _id = $1;    
        `, [userId]);

        return res.status(200).json(rows[0]);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function updateUserProfile(req, res) {
    try {
        let { newPhone, newEmail } = req.body;
        const { email } = req.user;

        let msg = {};

        if (newEmail) {
            const { rowCount } = await pool.query(`
                SELECT email FROM users
                WHERE email = $1;    
            `, [newEmail]);
            rowCount && (msg.newEmail = "This email is already taken.");
        }
        else {
            const { rowCount } = await pool.query(`
                SELECT email FROM users
                WHERE email = $1 AND phone = $2;    
            `, [email, newPhone]);
            rowCount && (msg.newPhone = "The number is already in use.");
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
            await pool.query(`
                UPDATE users
                SET email = $1 WHERE _id = $2;    
            `, [newEmail, userId]);

            const { rows } = await pool.query(`
                SELECT * FROM tasks
                WHERE 
                user_id = $1 AND status = ${false} AND (alert_type = 'email' OR alert_type = 'both');
            `, [userId]);

            rows.forEach(row => {
                const { task, deadline, reminders, alertType } = row;

                cancelReminders(row._id, email);
                scheduleReminders({
                    _id: userId,
                    task,
                    deadline,
                    taskId: row._id,
                    dateArr: reminders,
                    alertType,
                    phone,
                    email: newEmail
                });
            });
        }
        else {
            await pool.query(`
                UPDATE users
                SET phone = $1 WHERE _id = $2;    
            `, [newPhone, userId]);

            const { rows } = await pool.query(`
                SELECT * FROM tasks
                WHERE 
                user_id = $1 AND status = ${false} AND (alert_type = 'sms' OR alert_type = 'both');
            `, [userId]);

            rows.forEach(row => {
                const { task, deadline, reminders, alertType } = row;

                cancelReminders(row._id, email);
                scheduleReminders({
                    _id: userId,
                    task,
                    deadline,
                    taskId: row._id,
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

export {
    signupController,
    verificationController,
    loginController,
    twoFactorAuthController,
    fetchUserProfile,
    updateUserProfile,
    verifyUpdateOTP
};