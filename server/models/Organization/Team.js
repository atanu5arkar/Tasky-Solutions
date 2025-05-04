import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true 
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
    }]
});

const TeamModel = mongoose.model('Team', teamSchema, 'teams');
export default TeamModel;