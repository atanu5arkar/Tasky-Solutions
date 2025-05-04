import express from "express";

import orgAuthentication from "../../middlewares/orgAuth.js"
import { projectValidator, validationMiddleware } from "../../middlewares/validators.js";
import { addProjectController, deleteProjectController, fetchAllProjects, updateProjectController } from "../../controllers/Organization/projectControllers.js";

const projectRouter = express.Router();

projectRouter.use(orgAuthentication);

projectRouter.get("/", fetchAllProjects);
projectRouter.post('/add', projectValidator(), validationMiddleware, addProjectController);
projectRouter.put('/update/:projectid', projectValidator(), validationMiddleware, updateProjectController);
projectRouter.delete('/delete/:projectid', deleteProjectController);

export default projectRouter;