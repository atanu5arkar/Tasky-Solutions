import express from "express";

import userAuthorization from "../../middlewares/userAuth.js";
import { createRzpOrder, verifyRzpPayment } from "../../controllers/rzpMiddlewares.js";
import {
    loginValidator,
    signupValidator,
    alertsFilterValidator,
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
    getScheduledTasksController,
    getAlertsController,
    filterAlertsController,
    updateUserProfile,
    verifyUpdateOTP
} from "../../controllers/Individual/userControllers.js";
import UserModel from "../../models/Individual/User.js";

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

userRouter.get('/tasks', userAuthorization, getScheduledTasksController);
userRouter.get('/alerts', userAuthorization, getAlertsController);

userRouter.get('/filter-alerts',
    userAuthorization,
    alertsFilterValidator(),
    validationMiddleware,
    filterAlertsController
);

userRouter.post("/create-order", userAuthorization, payAmountValidator(), validationMiddleware, createRzpOrder);
userRouter.post("/verify-payment", userAuthorization, verifyRzpPayment, async (req, res) => {
    try {
        const { amount } = req.body;
        const { userId } = req.user;

        const newCredits = (amount / 100) * 10;

        await UserModel.updateOne({ _id: userId }, {
            $inc: {
                "credits.email": newCredits,
                "credits.sms": newCredits
            }
        });
        return res.status(200).json({ msg: "Payment Successful" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Server Error." });
    }
});

export default userRouter;