import express from "express";

import orgAuthentication from "../../middlewares/orgAuth.js";
import { taskValidator, validationMiddleware } from "../../middlewares/validators.js";
import { 
    addOrgTaskController, 
    deleteOrgTaskController, 
    getAllOrgTasksController, 
    statusUpdateController, 
    updateOrgTaskController 
} from "../../controllers/Organization/orgTaskControllers.js";

const orgTaskRouter = express.Router();

orgTaskRouter.use(orgAuthentication);

orgTaskRouter.get("/", getAllOrgTasksController);
orgTaskRouter.post('/add/:projectid/:teamid', taskValidator(), validationMiddleware, addOrgTaskController);
orgTaskRouter.put('/update/:taskid/:teamid', taskValidator(), validationMiddleware, updateOrgTaskController);
orgTaskRouter.put('/status/:taskid/:teamid', statusUpdateController);
orgTaskRouter.delete('/delete/:taskid/:teamid', deleteOrgTaskController);

export default orgTaskRouter;