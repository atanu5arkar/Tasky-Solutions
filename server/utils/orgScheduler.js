import schedule, { scheduledJobs } from "node-schedule";
import axios from "axios";

import OrgModel from "../models/Organization/Org.js";

const { MICRO_SERVICE, API_KEY } = process.env;

async function updateOrgDoc(_id, alertType, date) {
    try {
        if (alertType != 'both')
            return await OrgModel.updateOne({ _id }, {
                $push: {
                    alertDates: date
                },
                $inc: {
                    [`credits.${alertType}`]: -1,
                    alerts: 1
                }
            });

        return await OrgModel.updateOne({ _id }, {
            $push: {
                alertDates: date
            },
            $inc: {
                'credits.email': -1,
                'credits.sms': -1,
                alerts: 2
            }
        });
    } catch (error) {
        console.log(error);
    }
}

function scheduleOrgReminders(jobData) {
    const {
        _id,
        task,
        taskId,
        deadline,
        alertType,
        members,
        dateArr,
        orgEmail } = jobData;

    return members.forEach(member => {
        const { email, phone } = member;

        dateArr.forEach((date, j) => {
            const jobName = `${taskId}-${orgEmail}-${member._id}-${j}org`;        

            schedule.scheduleJob(jobName, date, async () => {
                try {
                    await axios.post(`${MICRO_SERVICE}/send-reminder`,
                        {
                            task,
                            deadline,
                            email,
                            phone,
                            alertType,
                            count: j + 1
                        },
                        {
                            headers: { auth: API_KEY }
                        }
                    );
                    return updateOrgDoc(_id, alertType, date);
                } catch (error) {
                    console.log(error);
                }
            });
        });
    });
}

function cancelOrgReminders(taskId, orgEmail, memberId) {
    let counter = 0;

    while (counter < 3) {
        const jobName = `${taskId}-${orgEmail}-${memberId}-${counter}org`;
        const job = scheduledJobs[jobName];

        if (job) job.cancel();
        counter++;
    }
}

export { scheduleOrgReminders, cancelOrgReminders };