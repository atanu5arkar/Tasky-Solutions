import { useReducer } from "react";

import UserContext from "./userContext.jsx";
import userReducer from "./userReducer.jsx";
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
} from "./actionTypes.js";

function UserState(props) {
    const initialState = {
        profile: null,
        tasks: null,
        editData: null,
        profileEditData: { newEmail: '', newPhone: '' },
        showAddModal: false,
        showEditModal: false,
        showOTPModal: false
    };

    const [state, dispatch] = useReducer(userReducer, initialState);

    async function fetchUserProfile(auth) {
        try {
            const req = new Request("/api/user/profile", {
                method: "GET",
                headers: { auth }
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();
            dispatch({ type: SET_PROFILE, payload: resBody });

        } catch (error) {
            console.log(error);
        }
    }

    async function fetchUserTasks(auth) {
        try {
            const req = new Request("/api/tasks", {
                method: "GET",
                headers: { auth }
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();
            dispatch({ type: SET_TASKS, payload: resBody });

        } catch (error) {
            console.log(error);
        }
    }

    function showScheduleUI() {
        dispatch({ type: SET_ADD_MODAL });
    }

    function hideScheduleUI() {
        dispatch({ type: RESET_ADD_MODAL });
    }

    function showEditTaskUI(data) {
        dispatch({ type: SET_EDIT_MODAL, payload: data });
    }

    function hideEditTaskUI() {
        dispatch({ type: RESET_EDIT_MODAL });
    }

    function showOTPUI() {
        dispatch({ type: SET_OTP_MODAL });
    }

    function hideOTPUI() {
        dispatch({ type: RESET_OTP_MODAL });
    }

    async function profileUpdateHandler({ setFormErrors, alertContext, userContext }) {
        try {
            const auth = localStorage.getItem("auth");
            const newCreds = userContext.profileEditData;

            for (const k in newCreds)
                if (!newCreds[k]) newCreds[k] = undefined;

            const req = new Request("/api/user/update", {
                method: "PUT",
                headers: {
                    auth,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userContext.profileEditData)
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();
            
            if (!userContext.showOTPModal) {
                setFormErrors({});
                userContext.showOTPUI();    
            }
           
        } catch (error) {
            if (res.status == 401) {
                alertContext.alertHandler("error", "Your token has expired.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                return setTimeout(() => location.href = "/login", 1000);
            }
            if (res.status == 400)
                return !userContext.showOTPModal && setFormErrors({ ...resBody.validationErrors });

            if (res.status == 409)
                return !userContext.showOTPModal && setFormErrors({ ...resBody });

            if (res.status == 500)
                return alertContext.alertHandler("error", "Something Went Wrong.");
        }
    }

    function setProfileEditData(data) {
        dispatch({ type: SET_PROF_EDIT_DATA, payload: data });
    }

    return (
        <UserContext.Provider value={{
            profile: state.profile,
            tasks: state.tasks,
            editData: state.editData,
            profileEditData: state.profileEditData,
            showAddModal: state.showAddModal,
            showEditModal: state.showEditModal,
            showOTPModal: state.showOTPModal,
            fetchUserProfile,
            fetchUserTasks,
            showScheduleUI,
            hideScheduleUI,
            showEditTaskUI,
            hideEditTaskUI,
            showOTPUI,
            hideOTPUI,
            profileUpdateHandler,
            setProfileEditData
        }}
        >
            {props.children}
        </UserContext.Provider>
    );
}

export default UserState;
