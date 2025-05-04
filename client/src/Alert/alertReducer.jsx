import { SET_ALERT, RESET_ALERT } from "../Individual/contexts/actionTypes.js";

function alertReducer(state, action) {
    switch (action.type) {
        case SET_ALERT:
            return { alert: action.payload };

        case RESET_ALERT:
            return { alert: null };

        default:
            return state;
    }
}

export default alertReducer;
