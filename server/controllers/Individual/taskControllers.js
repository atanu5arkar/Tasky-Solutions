import { parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

import { pool } from "../../utils/connectPostgres.js";
import { getReminders } from "../../utils/helpers.js";
import { cancelReminders, scheduleReminders } from "../../utils/userScheduler.js";

/* 
    @route: /api/tasks
    @method: GET
*/
async function getAllTasksController(req, res) {
    try {
        const { userId } = req.user;
        const { rows } = await pool.query(`
            SELECT _id, task, deadline, status, alert_type 
            FROM tasks WHERE user_id = $1;
        `, [userId]);

        return res.status(200).json(rows);
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

        const { rows } = await pool.query(`
            INSERT INTO tasks (user_id, task, deadline, reminders, alert_type)    
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `, [userId, task, deadline, reminders, alertType]);

        scheduleReminders({
            _id: userId,
            task,
            deadline,
            taskId: rows[0]._id,
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

        const { rowCount } = await pool.query(`
            UPDATE tasks  
            SET task = $1, deadline = $2, reminders = $3, status = $4, alert_type = $5
            WHERE _id = $6 AND user_id = $7;
        `, [task, deadline, reminders, status, alertType, taskid, userId]);

        cancelReminders(taskid, email);

        if (!status && rowCount) {
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

        const { rows } = await pool.query(`
            UPDATE tasks
            SET status = $1
            WHERE _id = $2 AND user_id = $3
            RETURNING *;
        `, [status, taskid, userId]);

        if (!status && rows.length) {
            const { deadline } = rows[0]; // GMT 0
            const mins = (new Date(deadline) - new Date()) / (1000 * 60);

            if (mins >= 2) {
                const reminders = getReminders(deadline);
                
                await pool.query(`
                    UPDATE tasks
                    SET reminders = $1
                    WHERE _id = $2 AND user_id = $3
                    RETURNING *;
                `, [reminders, taskid, userId]);

                scheduleReminders({
                    _id: userId,
                    task: rows[0].task,
                    deadline,
                    taskId: taskid,
                    dateArr: reminders,
                    alertType: rows[0].alertType,
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

        await pool.query(`
            DELETE FROM tasks
            WHERE _id = $1 AND user_id = $2;    
        `, [taskid, userId]);

        cancelReminders(taskid, email);
        return res.status(200).json({ msg: 'Task Deleted Successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

export {
    getAllTasksController,
    addTaskController,
    deleteTaskController,
    updateTaskController,
    statusUpdateController
};