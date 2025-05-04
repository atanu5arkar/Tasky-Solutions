import nodemailer from "nodemailer";

const { BREVO_USER, BREVO_PASS } = process.env;

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: BREVO_USER,
        pass: BREVO_PASS
    }
});

async function sendEmail(emailData) {
    try {
        const { email, subject, body } = emailData;

        const info = await transporter.sendMail({
            from: "'Tasky Solutions' <mail@atanu.dev>",
            to: email,
            subject,
            html: body
        });
        return console.log(info.messageId);

    } catch (error) {
        console.error(error);
    }
}

export default sendEmail;