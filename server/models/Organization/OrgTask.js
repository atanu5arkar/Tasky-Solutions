import mongoose from "mongoose";

const orgTaskSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Project'
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Team'
    },
    task: {
        type: String,
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    status: {
        type: Boolean,
        default: false
    },
    reminders: [{
        type: Date
    }],
    alertType: {
        type: String,
        required: true
    }
});

const OrgTaskModel = mongoose.model('OrgTask', orgTaskSchema, 'orgTasks');
export default OrgTaskModel;