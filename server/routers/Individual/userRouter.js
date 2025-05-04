import express from "express";
import { pool } from "../../utils/connectPostgres.js";

import userAuthorization from "../../middlewares/userAuth.js";
import { createRzpOrder, verifyRzpPayment } from "../../controllers/rzpMiddlewares.js";
import {
    loginValidator,
    signupValidator,
    validationMiddleware,
    profileDataValidator,
    payAmountValidator
} from "../../middlewares/validators.js";
import {
    signupController,
    verificationController,
    loginController,
    twoFactorAuthController,
    fetchUserProfile,
    updateUserProfile,
    verifyUpdateOTP
} from "../../controllers/Individual/userControllers.js";

const userRouter = express.Router();

userRouter.post('/signup', signupValidator(), validationMiddleware, signupController);
userRouter.get('/verify-links', verificationController);

userRouter.post('/login', loginValidator(), validationMiddleware, loginController);
userRouter.post('/verify-otp', twoFactorAuthController);

userRouter.get("/auth", userAuthorization, (req, res) => {
    return res.status(200).json({ name: req.user.name, type: req.user.type });
});

userRouter.get('/profile', userAuthorization, fetchUserProfile);
userRouter.put('/update', userAuthorization, profileDataValidator(), validationMiddleware, updateUserProfile);
userRouter.post("/update/verify", userAuthorization, verifyUpdateOTP);

userRouter.post("/create-order", userAuthorization, payAmountValidator(), validationMiddleware, createRzpOrder);
userRouter.post("/verify-payment", userAuthorization, verifyRzpPayment, async (req, res) => {
    try {
        const { amount } = req.body;
        const { userId } = req.user;

        const newCredits = (amount / 100) * 10;

        await pool.query(`
            UPDATE users
            SET 
                sms_credits = sms_credits + $1, 
                email_credits = email_credits + $1
            WHERE _id = $2;    
        `, [newCredits, userId]);

        return res.status(200).json({ msg: "Payment Successful" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Server Error." });
    }
});

export default userRouter;