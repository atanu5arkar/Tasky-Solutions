import express from "express";

import "./utils/redisClient.js";
import authorizeRequest from "./middlewares/authorization.js";
import {
    sendLinksController,
    verifyLinksController,
    sendOTPController,
    verifyOTPController,
    sendInviteController,
    verifyInviteController,
    sendReminderController,
    credUpdateController,
    verifyUpdateOTPController,
} from "./controllers/controllers.js";

const app = express();
const port = process.env.PORT || 1235;

app.use(authorizeRequest);

app.use(express.json());

app.post('/send-links', sendLinksController);
app.post('/verify-links', verifyLinksController);

app.post('/send-otp', sendOTPController);
app.post('/verify-otp', verifyOTPController);

app.post("/cred-update", credUpdateController);
app.post("/cred-update/verify", verifyUpdateOTPController);

app.post('/send-invite', sendInviteController);
app.post('/verify-invite', verifyInviteController);

app.post('/send-reminder', sendReminderController);

app.use('/', (req, res) => {
    return res.status(404).json({ msg: 'API Not Found!' });
});

app.listen(port, () => {
    console.log('Microservice running at', port);
});