import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    plan: {
        type: String,
        default: 'free'
    },
    name: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        email: {
            type: Boolean,
            default: false
        },
        phone: {
            type: Boolean,
            default: false
        }
    },
    credits: {
        email: {
            type: Number,
            default: 150
        },
        sms: {
            type: Number,
            default: 50
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    alerts: {
        type: Number,
        default: 0
    },
    alertDates: [{
        type: Date
    }],
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }]
});

const UserModel = mongoose.model('User', userSchema, 'users');
export default UserModel;