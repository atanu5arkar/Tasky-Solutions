import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Org'
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: 'Team'
    }
});

const ProjectModel = mongoose.model('Project', projectSchema, 'projects');
export default ProjectModel;