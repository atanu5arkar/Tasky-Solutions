import express from "express";

import adminAuthentication from "../middlewares/adminAuth.js";
import { alertsFilterValidator, validationMiddleware } from "../middlewares/validators.js";
import {
    seedDBController,
    getTasksCountController,
    getAlertsCountController,
    filterAlertsController,
    suspendUserController,
    suspendOrgController,
    activateUserController,
    activateOrgController,
    resetUserRemindersController,
    resetOrgRemindersController,
    cancelUserRemindersController,
    cancelOrgRemindersController,
} from "../controllers/adminControllers.js";

const adminRouter = express.Router();

// adminRouter.use(adminAuthentication);

adminRouter.get('/seed-db', seedDBController);
adminRouter.get('/tasks', getTasksCountController);

adminRouter.get('/alerts', getAlertsCountController);
adminRouter.get('/filter-alerts', alertsFilterValidator(), validationMiddleware, filterAlertsController);

adminRouter.put('/suspend-user/:userid', suspendUserController);
adminRouter.put('/suspend-org/:orgid', suspendOrgController);

adminRouter.put('/activate-user/:userid', activateUserController);
adminRouter.put('/activate-org/:orgid', activateOrgController);

adminRouter.get('/user/reset-reminders', resetUserRemindersController);
adminRouter.get('/org/reset-reminders', resetOrgRemindersController);

adminRouter.get('/user/cancel-reminders', cancelUserRemindersController);
adminRouter.get('/org/cancel-reminders', cancelOrgRemindersController);

export default adminRouter;