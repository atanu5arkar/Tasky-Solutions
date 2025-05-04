import twilio from "twilio";

const {
    TWILIO_SID,
    TWILIO_AUTH,
    TWILIO_NO
} = process.env;

const client = twilio(TWILIO_SID, TWILIO_AUTH);

async function sendSMS(msgData) {
    try {
        const { body, phone } = msgData;
        const msg = await client.messages.create({
            body,
            to: phone,
            from: TWILIO_NO
        });
        return console.log(msg.sid);

    } catch (error) {
        console.error(error);
    }
}

export default sendSMS;