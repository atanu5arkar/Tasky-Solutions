import express from "express";

import userAuthentication from "../../middlewares/userAuth.js";
import { taskValidator, validationMiddleware } from "../../middlewares/validators.js";
import { 
    addTaskController, 
    deleteTaskController, 
    getAllTasksController, 
    getTaskController, 
    updateTaskController,
    statusUpdateController
} from "../../controllers/Individual/taskControllers.js";

const taskRouter = express.Router();

taskRouter.use(userAuthentication);

taskRouter.get('/', getAllTasksController);
taskRouter.get('/:taskid', getTaskController);

taskRouter.post('/add', taskValidator(), validationMiddleware, addTaskController);
taskRouter.put('/update/:taskid', taskValidator(), validationMiddleware, updateTaskController);
taskRouter.put("/status/:taskid", statusUpdateController);
taskRouter.delete('/delete/:taskid', deleteTaskController);

export default taskRouter;