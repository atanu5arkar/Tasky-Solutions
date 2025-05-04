import OrgModel from "../../models/Organization/Org.js";
import ProjectModel from "../../models/Organization/Project.js";
import OrgTaskModel from "../../models/Organization/OrgTask.js";
import { cancelOrgReminders, scheduleOrgReminders } from "../../utils/orgScheduler.js";
import TeamModel from "../../models/Organization/Team.js";

async function fetchAllProjects(req, res) {
    try {
        const { orgId } = req.org;
        let projects = await ProjectModel.find({ organization: orgId });
        projects = projects.map(projDoc => projDoc.toObject());
        return res.status(200).json(projects);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/projects/add
    @method: POST
    @body: { title, description }
*/
async function addProjectController(req, res) {
    try {
        const { orgId } = req.org;
        const { title, description } = req.body;

        const projDoc = await ProjectModel({ title, description, organization: orgId });
        await OrgModel.updateOne({ _id: orgId }, { $push: { projects: projDoc._id } });
        await projDoc.save();

        return res.status(201).json({ msg: 'New Project Created Successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/projects/update/:projectid
    @method: PUT
    @body: { title, description, team }
*/
async function updateProjectController(req, res) {
    try {
        const { orgId, email: orgEmail } = req.org;
        const { projectid } = req.params;
        let { title, description, team } = req.body;

        const projDoc = await ProjectModel.findOne({ _id: projectid, organization: orgId });
        
        const tasks = await OrgTaskModel.find({
            project: projectid,
            organization: orgId,
            status: false,
            deadline: { $gt: new Date() }
        });

        projDoc.title = title;
        projDoc.description = description;

        if (projDoc.team?.toHexString() == team) {
            await projDoc.save();
            return res.status(200).json({ msg: 'Project Updated Successfully' });
        }

        /* 
         * Cancel reminders for the old team and schedule for the new one
         * For team deletion, cancellation is taken care of in the relevant team controller
        */

        if (projDoc.team) var oldTeamDoc = await TeamModel.findOne({ _id: projDoc.team, organization: orgId }).populate("members");
        const newTeamDoc = await TeamModel.findOne({ _id: team, organization: orgId }).populate("members");

        tasks.forEach(taskDoc => {
            console.log("I am here");
            
            const { _id: taskid, task, deadline, reminders, alertType } = taskDoc;
            if (oldTeamDoc) oldTeamDoc.members.forEach(mem => cancelOrgReminders(taskid, orgEmail, mem._id));

            scheduleOrgReminders({
                _id: orgId,
                taskId: taskid,
                task,
                deadline,
                dateArr: reminders,
                alertType,
                orgEmail,
                members: newTeamDoc.members,
            });
        });

        projDoc.team = team;
        await projDoc.save();

        await OrgTaskModel.updateMany({ project: projectid, organization: orgId }, { $set: { team } });
        return res.status(200).json({ msg: 'Project Updated Successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/projects/delete/:projectid
    @method: DELETE
*/
async function deleteProjectController(req, res) {
    try {
        const { orgId, email: orgEmail } = req.org;
        const { projectid } = req.params;

        // Update the org record
        await OrgModel.updateOne({ _id: orgId }, { $pull: { projects: projectid } });

        // Cancel any reminders and delete the associated tasks
        const tasks = await OrgTaskModel.find({ project: projectid, organization: orgId });

        if (tasks.length) {
            const team = await TeamModel.findOne({ _id: tasks[0].team }).populate("members");
            tasks.forEach(taskDoc =>
                team.members.forEach(mem => cancelOrgReminders(taskDoc._id, orgEmail, mem._id))
            );
            await OrgTaskModel.deleteMany({ project: projectid, organization: orgId });
        }

        await ProjectModel.deleteOne({ _id: projectid, organization: orgId });
        return res.status(200).json({ msg: 'Project Deleted Successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

export { fetchAllProjects, addProjectController, updateProjectController, deleteProjectController };