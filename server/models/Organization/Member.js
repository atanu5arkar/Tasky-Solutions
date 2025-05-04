import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Team'
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
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
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
    }
});

const MemberModel = mongoose.model('Member', memberSchema, 'members');
export default MemberModel;