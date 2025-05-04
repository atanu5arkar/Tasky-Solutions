import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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

const TaskModel = mongoose.model('Task', taskSchema, 'tasks');
export default TaskModel;