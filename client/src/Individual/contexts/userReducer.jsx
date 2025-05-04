import {
    RESET_ADD_MODAL,
    RESET_EDIT_MODAL,
    SET_ADD_MODAL,
    SET_EDIT_MODAL,
    SET_OTP_MODAL,
    RESET_OTP_MODAL,
    SET_PROFILE,
    SET_TASKS,
    SET_PROF_EDIT_DATA
} from "./actionTypes";

function userReducer(state, action) {
    switch (action.type) {
        case SET_PROFILE:
            return {
                ...state,
                profile: action.payload
            };

        case SET_TASKS:
            return {
                ...state,
                tasks: action.payload
            };

        case SET_ADD_MODAL:
            return {
                ...state,
                showAddModal: true
            };

        case RESET_ADD_MODAL:
            return {
                ...state,
                showAddModal: false
            };

        case SET_EDIT_MODAL:
            return {
                ...state,
                showEditModal: true,
                editData: action.payload
            };

        case RESET_EDIT_MODAL:
            return {
                ...state,
                showEditModal: false
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

        case SET_PROF_EDIT_DATA:
            return {
                ...state,
                profileEditData: action.payload
            };

        default:
            return state;
    }
}

export default userReducer;
