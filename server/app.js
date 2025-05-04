import express from "express";
import path from "node:path";

import "./utils/connectMongo.js";
import adminRouter from "./routers/adminRouter.js";
import userRouter from "./routers/Individual/userRouter.js";
import taskRouter from "./routers/Individual/taskRouter.js";

import orgRouter from "./routers/Organization/orgRouter.js";
import projectRouter from "./routers/Organization/projectRouter.js";
import teamRouter from "./routers/Organization/teamRouter.js";
import orgTaskRouter from "./routers/Organization/orgTaskRouter.js";

const app = express();
const port = process.env.PORT || 1234;
const __dirname = import.meta.dirname;

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/tasks', taskRouter);

app.use('/api/org', orgRouter);
app.use('/api/teams', teamRouter);
app.use('/api/projects', projectRouter);
app.use('/api/orgtasks', orgTaskRouter);

app.use('/', (req, res) => {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
    console.log('Tasky server running at', port);
});