import mongoose from "mongoose";

const orgSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
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
    projects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }],
    teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }]
});

const OrgModel = mongoose.model('Org', orgSchema, 'organizations');
export default OrgModel;