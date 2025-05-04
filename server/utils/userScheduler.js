import schedule, { scheduledJobs } from "node-schedule";
import axios from "axios";

import UserModel from "../models/Individual/User.js";

const { MICRO_SERVICE, API_KEY } = process.env;

async function updateUserDoc(_id, alertType, date) {
    try {
        if (alertType != 'both')
            return await UserModel.updateOne({ _id }, {
                $push: {
                    alertDates: date
                },
                $inc: {
                    [`credits.${alertType}`]: -1,
                    alerts: 1
                }
            });

        return await UserModel.updateOne({ _id }, {
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

function scheduleReminders(jobData) {
    const {
        _id,
        task,
        taskId,
        deadline,
        dateArr,
        alertType,
        email,
        phone } = jobData;

    return dateArr.forEach((date, i) => {
        const jobName = `${taskId}-${email}${i}`;

        schedule.scheduleJob(jobName, date, async () => {
            try {
                await axios.post(`${MICRO_SERVICE}/send-reminder`,
                    {
                        task,
                        deadline,
                        email,
                        phone,
                        alertType,
                        count: i + 1
                    },
                    {
                        headers: { auth: API_KEY }
                    }
                );
                return updateUserDoc(_id, alertType, date);
            } catch (error) {
                console.log(error);
            }
        });
    });
}

function cancelReminders(taskId, email) {
    let counter = 0;

    while (counter < 3) {
        const jobName = `${taskId}-${email}${counter}`;
        const job = scheduledJobs[jobName];

        if (job) job.cancel();
        counter++;
    }
}

export { scheduleReminders, cancelReminders };