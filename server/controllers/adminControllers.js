import TaskModel from "../models/Individual/Task.js";
import UserModel from "../models/Individual/User.js";
import OrgModel from "../models/Organization/Org.js";
import OrgTaskModel from "../models/Organization/OrgTask.js";
import TeamModel from "../models/Organization/Team.js";
import { seedOrgs, seedTeamsProjectsTasks, seedUsers, seedUserTasks } from "../utils/helpers.js";
import { cancelOrgReminders, scheduleOrgReminders } from "../utils/orgScheduler.js";
import { cancelReminders, scheduleReminders } from "../utils/userScheduler.js";

/* 
    @route: /api/admin/seed-db
    @method: GET
*/
async function seedDBController(req, res) {
    try {
        // await seedUsers();
        // await seedUserTasks();
        // await seedOrgs();
        await seedTeamsProjectsTasks();
        return res.status(200).json({ msg: 'DB Seeding Successful' });

    } catch (error) {
        console.log('DB Seeding Failed!\n', error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/admin/tasks
    @method: GET
*/
async function getTasksCountController(req, res) {
    try {
        const [res1] = await TaskModel.aggregate([
            {
                $group: {
                    _id: null,
                    tasks: {
                        $sum: 1
                    }
                }
            }
        ]);

        const [res2] = await OrgTaskModel.aggregate([
            {
                $group: {
                    _id: null,
                    tasks: {
                        $sum: 1
                    }
                }
            }
        ]);
        return res.status(200).json({ tasks: res1.tasks + res2.tasks });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/admin/alerts
    @method: GET
*/
async function getAlertsCountController(req, res) {
    try {
        const [res1] = await UserModel.aggregate([
            {
                $group: {
                    _id: null,
                    alerts: {
                        $sum: '$alerts'
                    }
                }
            }
        ]);

        const [res2] = await OrgModel.aggregate([
            {
                $group: {
                    _id: null,
                    alerts: {
                        $sum: '$alerts'
                    }
                }
            }
        ]);
        return res.status(200).json({ alerts: res1.alerts + res2.alerts });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/admin/filter-alerts
    @method: GET
    @query: from, to (GMT date strings)
*/
async function filterAlertsController(req, res) {
    try {
        const { from, to } = req.query;
        const startDate = new Date(from);
        const endDate = new Date(to);
        const midnight = [0, 0, 0, 0];

        startDate.setUTCHours(...midnight);

        endDate.setUTCHours(...midnight);
        endDate.setUTCDate(endDate.getUTCDate() + 1);

        const [res1] = await UserModel.aggregate([
            {
                $unwind: '$alertDates'
            },
            {
                $match: {
                    alertDates: { $gte: startDate, $lt: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    alerts: {
                        $sum: 1
                    },
                    dates: {
                        $push: '$alertDates'
                    }
                }
            }
        ]);

        const [res2] = await OrgModel.aggregate([
            {
                $unwind: '$alertDates'
            },
            {
                $match: {
                    alertDates: { $gte: startDate, $lt: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    alerts: {
                        $sum: 1
                    },
                    dates: {
                        $push: '$alertDates'
                    }
                }
            }
        ]);
        return res.status(200).json({ alerts: res1.alerts + res2.alerts });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/admin/suspend-user/:userid
    @method: PUT
*/
async function suspendUserController(req, res) {
    try {
        const { userid } = req.params;
        await UserModel.updateOne({ _id: userid }, { $set: { isActive: false } });
        return res.status(200).json({ msg: 'Suspension Successful' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/admin/activate-user/:userid
    @method: PUT
*/
async function activateUserController(req, res) {
    try {
        const { userid } = req.params;
        await UserModel.updateOne({ _id: userid }, { $set: { isActive: true } });
        return res.status(200).json({ msg: 'Suspension Revoked' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/admin/suspend-org/:orgid
    @method: PUT
*/
async function suspendOrgController(req, res) {
    try {
        const { orgid } = req.params;
        await OrgModel.updateOne({ _id: orgid }, { $set: { isActive: false } });
        return res.status(200).json({ msg: 'Suspension Successful' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

/* 
    @route: /api/admin/activate-org/:orgid
    @method: PUT
*/
async function activateOrgController(req, res) {
    try {
        const { orgid } = req.params;
        await OrgModel.updateOne({ _id: orgid }, { $set: { isActive: true } });
        return res.status(200).json({ msg: 'Suspension Revoked' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}


async function resetUserRemindersController(req, res) {
    try {
        const tasks = await TaskModel.find({
            deadline: { $gt: new Date() }, status: false
        }).populate('user');

        tasks.forEach(doc => {
            const { _id: taskId, user, task, deadline, reminders, alertType } = doc;

            scheduleReminders({
                _id: user._id,
                task,
                deadline,
                taskId,
                dateArr: reminders,
                alertType,
                phone: user.phone,
                email: user.email
            });
        });
        return res.status(200).end();

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function resetOrgRemindersController(req, res) {
    try {
        const orgTasks = await OrgTaskModel.find({
            deadline: { $gt: new Date() },
            status: false
        });

        for (let i = 0; i < orgTasks.length; i++) {
            const {
                organization,
                team,
                task,
                _id,
                deadline,
                reminders,
                alertType } = orgTasks[i];

            const org = await OrgModel.findById(organization);
            const teamDoc = await TeamModel.findById(team).populate('members');

            scheduleOrgReminders({
                _id: organization,
                task,
                taskId: _id,
                deadline,
                alertType,
                members: teamDoc.members,
                dateArr: reminders,
                orgEmail: org.email
            });
        }
        return res.status(200).end();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function cancelUserRemindersController(req, res) {
    try {
        const tasks = await TaskModel.find({
            deadline: { $gt: new Date() }, status: false
        }).populate('user');

        tasks.forEach(doc => cancelReminders(doc._id, doc.user.email));
        return res.status(200).end();

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

async function cancelOrgRemindersController(req, res) {
    try {
        const orgTasks = await OrgTaskModel.find({}).populate('organization');

        orgTasks.forEach((task) => {
            const { _id, organization } = task;
            cancelOrgReminders(_id, organization.email);
        });
        return res.status(200).end();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: 'Server Error!' });
    }
}

export {
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
    cancelOrgRemindersController
};