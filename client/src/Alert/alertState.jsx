import { useReducer } from "react";

import AlertContext from "./alertContext.jsx";
import alertReducer from "./alertReducer.jsx";
import { RESET_ALERT, SET_ALERT } from "../Individual/contexts/actionTypes.js";

function AlertState(props) {
    const initState = { alert: null };
    const [state, dispatch] = useReducer(alertReducer, initState);

    function alertHandler(type, msg) {
        dispatch({ type: SET_ALERT, payload: { type, msg } });
        return setTimeout(() => dispatch({ type: RESET_ALERT }), 4000);
    }

    return (
        <AlertContext.Provider value={{
            alert: state.alert,
            alertHandler
        }}>
            {props.children}
        </AlertContext.Provider>
    );
}

export default AlertState;
