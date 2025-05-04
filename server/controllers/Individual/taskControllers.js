import { parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

import TaskModel from "../../models/Individual/Task.js";
import UserModel from "../../models/Individual/User.js";
import { getReminders } from "../../utils/helpers.js";
import { cancelReminders, scheduleReminders } from "../../utils/userScheduler.js";

/* 
    @route: /api/tasks
    @method: GET
*/
async function getAllTasksController(req, res) {
    try {
        const { userId } = req.user;
        let tasks = await TaskModel.find({ user: userId }, '-user');
        tasks = tasks.map(task => task.toObject());
        return res.status(200).json(tasks);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/tasks/:taskid
    @method: GET
*/
async function getTaskController(req, res) {
    try {
        const { userId } = req.user;
        const { taskid } = req.params;

        const task = await TaskModel.findOne({ _id: taskid, user: userId });
        return res.status(200).json(task);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/tasks/add
    @method: POST
    @body: { task, deadline, alertType }

    * Triggers node-schedule to set up crons for sending reminders via the micro-service.
*/
async function addTaskController(req, res) {
    try {
        const { userId, phone, email } = req.user;
        let { task, deadline, alertType } = req.body;

        deadline = parse(deadline, "yyyy-MM-dd'T'HH:mm", new Date());
        deadline = fromZonedTime(deadline, "Asia/Kolkata");
        
        const reminders = getReminders(deadline);
        
        const taskDoc = new TaskModel({
            task,
            user: userId,
            deadline,
            reminders,
            alertType
        });
        await taskDoc.save();
        await UserModel.updateOne({ _id: userId }, { $push: { tasks: taskDoc._id } });

        scheduleReminders({
            _id: userId,
            task,
            deadline,
            taskId: taskDoc._id,
            dateArr: reminders,
            alertType,
            phone,
            email
        });
        return res.status(200).json({ msg: 'Task Scheduled Successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/tasks/update
    @method: POST
    @body: { task, deadline, alertType, status }

    * Schedule new reminder crons (if needed), cancelling any previous jobs
*/
async function updateTaskController(req, res) {
    try {
        let { task, deadline, alertType, status } = req.body;        
        const { taskid } = req.params;
        const { userId, phone, email } = req.user;

        deadline = parse(deadline, "yyyy-MM-dd'T'HH:mm", new Date());
        deadline = fromZonedTime(deadline, "Asia/Kolkata");
        
        const reminders = getReminders(deadline);
        status = status == "pending" ? false : true;

        await TaskModel.updateOne({ _id: taskid, user: userId }, {
            $set: { task, deadline, alertType, reminders, status }
        });
        
        cancelReminders(taskid, email);

        if (!status) {
            scheduleReminders({
                _id: userId,
                task,
                deadline,
                taskId: taskid,
                dateArr: reminders,
                alertType,
                phone,
                email
            });
        }
        return res.status(200).json({ msg: 'Task Updated Successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function statusUpdateController(req, res) {
    try {
        let { status } = req.body;
        const { userId, email, phone } = req.user;
        const { taskid } = req.params;

        await TaskModel.updateOne({ _id: taskid, user: userId }, {
            $set: { status }
        });

        if (!status) {
            const taskDoc = await TaskModel.findOne({ _id: taskid, user: userId });
            const { deadline } = taskDoc; // GMT 0
            const mins = (new Date(deadline) - new Date()) / (1000 * 60);

            if (mins >= 2) {
                const reminders = getReminders(deadline);
                await TaskModel.updateOne({ _id: taskid, user: userId }, { $set: { reminders } });

                scheduleReminders({
                    _id: userId,
                    task: taskDoc.task,
                    deadline,
                    taskId: taskid,
                    dateArr: reminders,
                    alertType: taskDoc.alertType,
                    phone,
                    email
                });
            }
        } else cancelReminders(taskid, email);

        return res.status(200).json({ msg: 'Status Updated Successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/tasks/delete/:taskid
    @method: DELETE

    * Delete the task and cancel all the crons
*/
async function deleteTaskController(req, res) {
    try {
        const { taskid } = req.params;
        const { userId, email } = req.user;

        await TaskModel.deleteOne({ _id: taskid, user: userId });
        await UserModel.updateOne({ _id: userId }, { $pull: { tasks: taskid } });
        cancelReminders(taskid, email);
        return res.status(200).json({ msg: 'Task Deleted Successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

export {
    getAllTasksController,
    getTaskController,
    addTaskController,
    deleteTaskController,
    updateTaskController,
    statusUpdateController
};