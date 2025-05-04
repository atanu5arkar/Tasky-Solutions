import bcrypt from "bcrypt";
import Chance from "chance";

import UserModel from "../models/Individual/User.js";
import TaskModel from "../models/Individual/Task.js";
import OrgModel from "../models/Organization/Org.js";
import TeamModel from "../models/Organization/Team.js";
import MemberModel from "../models/Organization/Member.js";
import ProjectModel from "../models/Organization/Project.js";
import OrgTaskModel from "../models/Organization/OrgTask.js";

const chance = new Chance();

function getReminders(date) {
    const duration = new Date(date) - Date.now();

    const reminders = [
        duration / 4,
        duration / 2,
        3 * duration / 4
    ];
    return reminders.map(ele => new Date(Date.now() + ele));
}

async function seedUsers() {
    try {
        const password = await bcrypt.hash(process.env.TEST_PASS_USERS, 10);

        const users = new Array(50).fill().map(ele => {
            return {
                name: chance.first(),
                email: chance.email({ domain: 'example.com' }),
                phone: chance.phone({ formatted: false }),
                password
            }
        });
        await UserModel.insertMany(users);
        return console.log('Users seeded successfully');

    } catch (error) {
        console.log(error);
    }
}

async function seedUserTasks() {
    try {
        const users = await UserModel.find({});

        for (let i = 0; i < users.length; i++) {
            const { _id } = users[i];

            // 12 seed tasks per user
            for (let j = 1; j <= 12; j++) {
                let deadline;

                if (j <= 4)
                    deadline = new Date(Date.now() - 1000 * 60 * 60 * 24 * j);
                else if (j <= 8)
                    deadline = new Date(Date.now() - 1000 * 60 * 60 * j);
                else
                    deadline = new Date(Date.now() - 1000 * 60 * 60 * 24 * j);

                const reminders = getReminders(deadline);

                const taskDoc = new TaskModel({
                    user: _id,
                    task: chance.sentence({ words: 3 }),
                    deadline,
                    reminders,
                    alertType: 'email'
                });
                await taskDoc.save();
                await UserModel.updateOne({ _id }, {
                    $push: {
                        tasks: taskDoc._id,
                        alertDates: {
                            $each: [...reminders]
                        }
                    },
                    $inc: {
                        alerts: 3,
                        'credits.email': -3
                    }
                });
            }
        }
        return console.log('User tasks seeded successfully');
    } catch (error) {
        console.log(error);
    }
}

async function seedOrgs() {
    try {
        const password = await bcrypt.hash(process.env.TEST_PASS_ORGS, 10);

        const orgs = new Array(50).fill().map(ele => {
            return {
                name: chance.company(),
                email: chance.email({ domain: 'example.org' }),
                phone: chance.phone({ formatted: false }),
                password
            }
        });
        await OrgModel.insertMany(orgs);
        return console.log('Orgs seeded successfully');

    } catch (error) {
        console.log(error);
    }
}

async function seedTeamsProjectsTasks() {
    try {
        const orgs = await OrgModel.find({});

        for (let i = 0; i < orgs.length; i++) {
            const org = orgs[i];

            for (let j = 1; j <= 2; j++) {
                const team = new TeamModel({ name: "Team" + chance.letter({ casing: "upper" }), organization: org._id });

                // 3 members per team
                for (let k = 1; k <= 3; k++) {
                    const member = new MemberModel({
                        organization: org._id,
                        team: team._id,
                        name: chance.first(),
                        email: chance.email({ domain: 'xample.com' }),
                        phone: chance.phone({ formatted: false })
                    });
                    await member.save();
                    team.members.push(member._id);
                }

                const project = new ProjectModel({
                    organization: org._id,
                    title: chance.sentence({ words: 5 }),
                    description: chance.paragraph({ sentences: 2 }),
                    team: team._id
                });

                // 6 tasks per project (and team)
                for (let k = 1; k <= 6; k++) {
                    let deadline;

                    if (k <= 2)
                        deadline = new Date(Date.now() - 1000 * 60 * 60 * 24 * j * k);
                    else if (k <= 4)
                        deadline = new Date(Date.now() - 1000 * 60 * 60 * j * k);
                    else
                        deadline = new Date(Date.now() - 1000 * 60 * 60 * 24 * j * k);

                    const reminders = getReminders(deadline);

                    await new OrgTaskModel({
                        organization: org._id,
                        project: project._id,
                        team: team._id,
                        task: chance.sentence({ words: 3 }),
                        deadline,
                        reminders,
                        alertType: 'email'
                    }).save();

                    org.alerts += 3;
                    org.credits.email -= 3;
                    org.alertDates.push(...reminders);
                }

                org.projects.push(project._id);
                org.teams.push(team._id);

                await project.save();
                await team.save();
            }
            await org.save();
        }
        return console.log('Projects, Teams, and Tasks seeded successfully');
    } catch (error) {
        console.log(error);
    }
}

export {
    getReminders,
    seedUsers,
    seedUserTasks,
    seedOrgs,
    seedTeamsProjectsTasks
};