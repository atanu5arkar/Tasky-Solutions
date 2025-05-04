import express from "express";

import orgAuthentication from "../../middlewares/orgAuth.js";
import { teamValidator, validationMiddleware } from "../../middlewares/validators.js";
import { addTeamController, deleteTeamController, getAllTeams, updateTeamController } from "../../controllers/Organization/teamControllers.js";

const teamRouter = express.Router();

teamRouter.use(orgAuthentication);

teamRouter.get("/", getAllTeams);
teamRouter.post('/add', teamValidator(), validationMiddleware, addTeamController);
teamRouter.put('/update/:teamid', teamValidator(), validationMiddleware, updateTeamController);
teamRouter.delete('/delete/:teamid', deleteTeamController);

export default teamRouter;