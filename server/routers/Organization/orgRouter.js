import express from "express";

import orgAuthorization from "../../middlewares/orgAuth.js";
import { createRzpOrder, verifyRzpPayment } from "../../controllers/rzpMiddlewares.js";
import { 
    alertsFilterValidator, 
    loginValidator, 
    memberValidator, 
    profileDataValidator, 
    signupValidator, 
    payAmountValidator,
    validationMiddleware 
} from "../../middlewares/validators.js";
import {
    orgSignupController,
    orgVerificationController,
    orgLoginController,
    orgTwoFactorAuthController,
    fetchOrgProfile,
    getOrgTasksCountController,
    getOrgAlertsCountController,
    filterOrgAlertsController,
    memberInviteController,
    verifyInviteController,
    fetchAllMembers,
    updateOrgProfile,
    verifyUpdateOTP,
} from "../../controllers/Organization/orgControllers.js";
import OrgModel from "../../models/Organization/Org.js";

const orgRouter = express.Router();

orgRouter.post('/signup', signupValidator(), validationMiddleware, orgSignupController);
orgRouter.get('/verify-links', orgVerificationController);

orgRouter.post('/login', loginValidator(), validationMiddleware, orgLoginController);
orgRouter.post('/verify-otp', orgTwoFactorAuthController);

orgRouter.get("/auth", orgAuthorization, (req, res) => {
    return res.status(200).json({ name: req.org.name, type: req.org.type });
});

orgRouter.get('/member/verify-links', verifyInviteController);

orgRouter.post('/member-invite',
    orgAuthorization,
    memberValidator(),
    validationMiddleware,
    memberInviteController
);

orgRouter.get('/profile', orgAuthorization, fetchOrgProfile);
orgRouter.put("/update", orgAuthorization, profileDataValidator(), validationMiddleware, updateOrgProfile);
orgRouter.post("/update/verify", orgAuthorization, verifyUpdateOTP);

orgRouter.get('/members', orgAuthorization, fetchAllMembers);
orgRouter.get('/tasks', orgAuthorization, getOrgTasksCountController);
orgRouter.get('/alerts', orgAuthorization, getOrgAlertsCountController);

orgRouter.get('/filter-alerts',
    orgAuthorization,
    alertsFilterValidator(),
    validationMiddleware,
    filterOrgAlertsController
);

orgRouter.post("/create-order", orgAuthorization, payAmountValidator(), validationMiddleware, createRzpOrder);
orgRouter.post("/verify-payment", orgAuthorization, verifyRzpPayment, async (req, res) => {
    try {
        const { amount } = req.body;
        const { orgId } = req.org;

        const newCredits = (amount / 100) * 10;

        await OrgModel.updateOne({ _id: orgId }, {
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

export default orgRouter;