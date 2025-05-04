import MemberModel from "../../models/Organization/Member.js";
import TeamModel from "../../models/Organization/Team.js";
import ProjectModel from "../../models/Organization/Project.js";
import OrgModel from "../../models/Organization/Org.js";
import OrgTaskModel from "../../models/Organization/OrgTask.js";
import { cancelOrgReminders, scheduleOrgReminders } from "../../utils/orgScheduler.js";
import { scheduledJobs } from "node-schedule";

async function getAllTeams(req, res) {
    try {
        const { orgId } = req.org;
        let teams = await TeamModel.find({ organization: orgId });
        teams = teams.map(teamDoc => teamDoc.toObject());
        return res.status(200).json(teams);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/teams/add
    @method: POST
    @body: array of ObjectIds
*/
async function addTeamController(req, res) {
    try {
        const { orgId } = req.org;
        const { name, members } = req.body;

        const team = new TeamModel({ name, organization: orgId });

        for (let i = 0; i < members.length; i++) {
            const member = await MemberModel.findOne({ _id: members[i], organization: orgId });
            if (member) team.members.push(member._id);
        }
        await OrgModel.updateOne({ _id: orgId }, { $push: { teams: team._id } });
        await team.save();

        return res.status(200).json({ msg: 'Team Created Successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/teams/update/:teamid
    @method: PUT
    @body: array of ObjectIds
*/
async function updateTeamController(req, res) {
    try {
        const { orgId, email: orgEmail } = req.org;
        const { teamid } = req.params;
        const { name, members } = req.body;

        const tasks = await OrgTaskModel.find({ team: teamid, organization: orgId });

        if (tasks.length) {
            const teamDoc = await TeamModel.findOne({ _id: teamid }).populate("members");

            tasks.forEach(taskDoc => {
                const { task, deadline, status, alertType, reminders } = taskDoc;
                if (status || ((new Date(deadline) - new Date()) < 0)) return;

                teamDoc.members.forEach(mem => cancelOrgReminders(taskDoc._id, orgEmail, mem._id));
                scheduleOrgReminders({
                    _id: orgId,
                    task,
                    taskId: taskDoc._id,
                    deadline,
                    alertType,
                    members: teamDoc.members,
                    dateArr: reminders,
                    orgEmail
                });
            });
        }

        await TeamModel.updateOne({ _id: teamid, organization: orgId }, { $set: { name, members } });
        return res.status(200).json({ msg: 'Team updated successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/teams/delete/:teamid
    @method: DELETE
*/
async function deleteTeamController(req, res) {
    try {
        const { orgId, email: orgEmail } = req.org;
        const { teamid } = req.params;

        const tasks = await OrgTaskModel.find({ team: teamid, organization: orgId });

        // Cancel reminders, if any, for all tasks assigned to the team
        if (tasks.length) {
            const teamDoc = await TeamModel.findOne({ _id: teamid }).populate("members");

            tasks.forEach(taskDoc => {
                if (taskDoc.status) return;
                teamDoc.members.forEach(mem => cancelOrgReminders(taskDoc._id, orgEmail, mem._id));
            });
            
            await OrgTaskModel.updateMany({ team: teamid }, { $set: { team: null } });
        }

        await OrgModel.updateOne({ _id: orgId }, { $pull: { teams: teamid } });
        await ProjectModel.updateOne({ organization: orgId, team: teamid }, { $set: { team: null } });
        await TeamModel.deleteOne({ _id: teamid, organization: orgId });

        return res.status(200).json({ msg: 'Team Deleted Successfully' });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

export {
    getAllTeams,
    addTeamController,
    updateTeamController,
    deleteTeamController
};