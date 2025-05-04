import {
    RESET_ADD_PROJ_MODAL,
    RESET_ADD_TASK_MODAL,
    RESET_EDIT_PROJ_MODAL,
    RESET_EDIT_TASK_MODAL,
    RESET_EDIT_TEAM_MODAL,
    RESET_INVITE_MODAL,
    RESET_OTP_MODAL,
    RESET_TEAM_MODAL,
    SET_ADD_PROJ_MODAL,
    SET_ADD_TASK_MODAL,
    SET_EDIT_PROJ_MODAL,
    SET_EDIT_TASK_MODAL,
    SET_EDIT_TEAM_MODAL,
    SET_INVITE_MODAL,
    SET_MEMBERS,
    SET_OTP_MODAL,
    SET_PROF_EDIT_DATA,
    SET_PROFILE,
    SET_PROJECTS,
    SET_TASKS,
    SET_TASKS_COUNT,
    SET_TEAM_MODAL,
    SET_TEAMS
} from "./actionTypes.js";

function orgReducer(state, action) {
    switch (action.type) {
        case SET_PROFILE:
            return {
                ...state,
                profile: action.payload
            };

        case SET_TASKS_COUNT:
            return {
                ...state,
                profile: { ...state.profile, tasks: action.payload }
            };

        case SET_PROJECTS:
            return {
                ...state,
                projects: action.payload
            };

        case SET_TASKS:
            return {
                ...state,
                tasks: action.payload
            };

        case SET_TEAMS:
            return {
                ...state,
                teams: action.payload
            };

        case SET_MEMBERS:
            return {
                ...state,
                members: action.payload
            }

        case SET_ADD_PROJ_MODAL:
            return {
                ...state,
                showAddProjModal: true
            };

        case RESET_ADD_PROJ_MODAL:
            return {
                ...state,
                showAddProjModal: false
            };

        case SET_EDIT_PROJ_MODAL:
            return {
                ...state,
                showEditProjModal: true,
                projEditData: action.payload
            };

        case RESET_EDIT_PROJ_MODAL:
            return {
                ...state,
                showEditProjModal: false
            };
        
        case SET_ADD_TASK_MODAL:
            return {
                ...state,
                showAddTaskModal: true,
                newTask: action.payload
            };

        case RESET_ADD_TASK_MODAL:
            return {
                ...state,
                showAddTaskModal: false,
                newTask: null
            };  
            
        case SET_EDIT_TASK_MODAL:
            return {
                ...state,
                taskEditData: action.payload
            };

        case RESET_EDIT_TASK_MODAL:
            return {
                ...state,
                taskEditData: null
            };

        case SET_TEAM_MODAL:
            return {
                ...state,
                showAddTeamModal: true
            };

        case RESET_TEAM_MODAL:
            return {
                ...state,
                showAddTeamModal: false
            };

        case SET_EDIT_TEAM_MODAL:
            return {
                ...state,
                showEditTeamModal: true,
                teamEditData: action.payload
            };

        case RESET_EDIT_TEAM_MODAL:
            return {
                ...state,
                showEditTeamModal: false
            };

        case SET_INVITE_MODAL:
            return {
                ...state,
                showInviteModal: true
            };

        case RESET_INVITE_MODAL:
            return {
                ...state,
                showInviteModal: false
            };

        case SET_PROF_EDIT_DATA:
            return {
                ...state,
                profileEditData: action.payload
            };

        case SET_OTP_MODAL:
            return {
                ...state,
                showOTPModal: true
            };

        case RESET_OTP_MODAL:
            return {
                ...state,
                showOTPModal: false
            };

        default:
            return state;
    }
}

export default orgReducer;
