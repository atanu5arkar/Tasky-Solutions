import { parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

import OrgTaskModel from "../../models/Organization/OrgTask.js";
import TeamModel from "../../models/Organization/Team.js";
import { getReminders } from "../../utils/helpers.js";
import { scheduleOrgReminders, cancelOrgReminders } from "../../utils/orgScheduler.js";

async function getAllOrgTasksController(req, res) {
    try {
        const { orgId } = req.org;

        let orgTasks = await OrgTaskModel.find({ organization: orgId });
        orgTasks = orgTasks.map(taskDoc => taskDoc.toObject());

        return res.status(200).json(orgTasks);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/orgtasks/:projectid/:teamid
    @method: POST
    @body: { task, deadline }
*/
async function addOrgTaskController(req, res) {
    try {
        const { orgId, email: orgEmail } = req.org;
        const { projectid, teamid } = req.params;
        let { task, deadline, alertType } = req.body;

        deadline = parse(deadline, "yyyy-MM-dd'T'HH:mm", new Date());
        deadline = fromZonedTime(deadline, "Asia/Kolkata");
        const reminders = getReminders(deadline);

        const taskDoc = new OrgTaskModel({
            task,
            deadline,
            reminders,
            alertType,
            organization: orgId,
            project: projectid,
            team: teamid
        });

        await taskDoc.save();
        const team = await TeamModel.findOne({ _id: teamid, organization: orgId }).populate('members');

        scheduleOrgReminders({
            _id: orgId,
            taskId: taskDoc._id,
            task,
            deadline,
            alertType,
            dateArr: reminders,
            orgEmail,
            members: team.members,
        });
        return res.status(200).json({ msg: 'Task Scheduled Successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/orgtasks/update/:taskid/:teamid
    @method: PUT
    @body: { task, deadline, status }
*/
async function updateOrgTaskController(req, res) {
    try {
        const { orgId, email: orgEmail } = req.org;
        const { taskid, teamid } = req.params;
        let { task, deadline, alertType, status } = req.body;

        deadline = parse(deadline, "yyyy-MM-dd'T'HH:mm", new Date());
        deadline = fromZonedTime(deadline, "Asia/Kolkata");

        const reminders = getReminders(deadline);
        status = status == 'pending' ? false : true;

        await OrgTaskModel.updateOne({ _id: taskid, organization: orgId }, {
            $set: {
                task,
                deadline,
                alertType,
                status,
                reminders
            }
        });

        const teamDoc = await TeamModel.findOne({ _id: teamid, organization: orgId }).populate('members');
        teamDoc.members.forEach(mem => cancelOrgReminders(taskid, orgEmail, mem._id));

        if (!status) {
            scheduleOrgReminders({
                _id: orgId,
                taskId: taskid,
                task,
                deadline,
                dateArr: reminders,
                alertType,
                orgEmail,
                members: teamDoc.members,
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
        const { orgId, email: orgEmail } = req.org;
        const { taskid, teamid } = req.params;

        const taskDoc = await OrgTaskModel.findOne({ _id: taskid, organization: orgId });
        const teamDoc = await TeamModel.findOne({ _id: teamid }).populate("members");

        taskDoc.status = status;

        if (!status) {
            const { task, deadline, alertType } = taskDoc;
            const mins = (new Date(deadline) - new Date()) / (1000 * 60);

            if (mins >= 2) {
                const reminders = getReminders(deadline);
                taskDoc.reminders = reminders;

                scheduleOrgReminders({
                    _id: orgId,
                    taskId: taskid,
                    task,
                    deadline,
                    alertType,
                    orgEmail,
                    dateArr: reminders,
                    members: teamDoc.members,
                });
            }
        } else teamDoc.members.forEach(mem => cancelOrgReminders(taskid, orgEmail, mem._id));

        await taskDoc.save();
        return res.status(200).json({ msg: 'Status Updated Successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/orgtasks/delete/:taskid
    @method: DELETE
*/
async function deleteOrgTaskController(req, res) {
    try {
        const { orgId, email: orgEmail } = req.org;
        const { taskid, teamid } = req.params;

        const teamDoc = await TeamModel.findOne({ _id: teamid, organization: orgId }).populate("members");
        teamDoc.members.forEach(mem => cancelOrgReminders(taskid, orgEmail, mem._id));

        await OrgTaskModel.deleteOne({ _id: taskid, organization: orgId });
        return res.status(200).json({ msg: 'Task Deleted Successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

export {
    getAllOrgTasksController,
    addOrgTaskController,
    updateOrgTaskController,
    statusUpdateController,
    deleteOrgTaskController
};