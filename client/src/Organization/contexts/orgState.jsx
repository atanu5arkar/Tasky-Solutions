import { useReducer } from "react";

import OrgContext from "./orgContext.jsx";
import orgReducer from "./orgReducer.jsx";
import {
    RESET_ADD_PROJ_MODAL,
    RESET_ADD_TASK_MODAL,
    RESET_EDIT_PROJ_MODAL,
    RESET_EDIT_TASK_MODAL,
    RESET_EDIT_TEAM_MODAL,
    RESET_INVITE_MODAL,
    RESET_TEAM_MODAL,
    SET_ADD_PROJ_MODAL,
    SET_ADD_TASK_MODAL,
    SET_EDIT_PROJ_MODAL,
    SET_EDIT_TASK_MODAL,
    SET_EDIT_TEAM_MODAL,
    SET_INVITE_MODAL,
    SET_MEMBERS,
    SET_PROFILE,
    SET_PROJECTS,
    SET_TASKS,
    SET_TASKS_COUNT,
    SET_TEAM_MODAL,
    SET_TEAMS,
    SET_PROF_EDIT_DATA,
    SET_OTP_MODAL,
    RESET_OTP_MODAL
} from "./actionTypes.js";

function OrgState(props) {
    const initialState = {
        profile: {},
        projects: [],
        tasks: [],
        teams: [],
        members: [],
        projEditData: null,
        newTask: null,
        taskEditData: null,
        teamEditData: null,
        showAddProjModal: false,
        showEditProjModal: false,
        showAddTaskModal: false,
        showAddTeamModal: false,
        showEditTeamModal: false,
        showInviteModal: false,
        showOTPModal: false,
        profileEditData: { newEmail: '', newPhone: '' }
    };

    const [state, dispatch] = useReducer(orgReducer, initialState);

    async function fetchOrgProfile(auth) {
        try {
            const req = new Request("/api/org/profile", {
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

    async function getScheduledTasksCount(auth) {
        try {
            const req = new Request("/api/org/tasks", {
                method: "GET",
                headers: { auth }
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();
            dispatch({ type: SET_TASKS_COUNT, payload: resBody.length ? resBody[0].scheduledTasks : 0 });

        } catch (error) {
            console.log(error);
        }
    }

    async function fetchProjects(auth) {
        try {
            const req = new Request("/api/projects", {
                method: "GET",
                headers: { auth }
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();
            dispatch({ type: SET_PROJECTS, payload: resBody });

        } catch (error) {
            console.log(error);
        }
    }

    async function fetchOrgTasks(auth) {
        try {
            const req = new Request("/api/orgtasks/", {
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

    async function fetchTeams(auth) {
        try {
            const req = new Request("/api/teams", {
                method: "GET",
                headers: { auth }
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();
            dispatch({ type: SET_TEAMS, payload: resBody });

        } catch (error) {
            console.log(error);
        }
    }

    async function fetchMembers(auth) {
        try {
            const req = new Request("/api/org/members", {
                method: "GET",
                headers: { auth }
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();
            dispatch({ type: SET_MEMBERS, payload: resBody });

        } catch (error) {
            console.log(error);
        }
    }

    function showAddProjUI() {
        dispatch({ type: SET_ADD_PROJ_MODAL });
    }

    function hideAddProjUI() {
        dispatch({ type: RESET_ADD_PROJ_MODAL });
    }

    function showEditProjUI(editData) {
        dispatch({ type: SET_EDIT_PROJ_MODAL, payload: editData });
    }

    function hideEditProjUI() {
        dispatch({ type: RESET_EDIT_PROJ_MODAL });
    }

    function showAddTaskUI(paramsData) {
        dispatch({ type: SET_ADD_TASK_MODAL, payload: paramsData });
    }

    function hideAddTaskUI() {
        dispatch({ type: RESET_ADD_TASK_MODAL });
    }

    function showEditTaskUI(data) {
        dispatch({ type: SET_EDIT_TASK_MODAL, payload: data });
    }

    function hideEditTaskUI() {
        dispatch({ type: RESET_EDIT_TASK_MODAL });
    }

    function showAddTeamUI() {
        dispatch({ type: SET_TEAM_MODAL });
    }

    function hideAddTeamUI() {
        dispatch({ type: RESET_TEAM_MODAL });
    }

    function showEditTeamUI(editData) {
        dispatch({ type: SET_EDIT_TEAM_MODAL, payload: editData });
    }

    function hideEditTeamUI() {
        dispatch({ type: RESET_EDIT_TEAM_MODAL });
    }

    function showInvitationUI() {
        dispatch({ type: SET_INVITE_MODAL });
    }

    function hideInvitationUI() {
        dispatch({ type: RESET_INVITE_MODAL });
    }

    function showOTPUI() {
        dispatch({ type: SET_OTP_MODAL });
    }

    function hideOTPUI() {
        dispatch({ type: RESET_OTP_MODAL });
    }

    function setProfileEditData(data) {
        dispatch({ type: SET_PROF_EDIT_DATA, payload: data });
    }

    async function profileUpdateHandler({ setFormErrors, alertContext, orgContext }) {
        try {
            const auth = localStorage.getItem("auth");
            const newCreds = orgContext.profileEditData;

            for (const k in newCreds)
                if (!newCreds[k]) newCreds[k] = undefined;

            const req = new Request("/api/org/update", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    auth,
                },
                body: JSON.stringify(orgContext.profileEditData)
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();
            
            if (!orgContext.showOTPModal) {
                setFormErrors({});
                orgContext.showOTPUI();    
            }
           
        } catch (error) {
            if (res.status == 401) {
                alertContext.alertHandler("error", "Your token has expired.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                return setTimeout(() => location.href = "/login", 1000);
            }
            if (res.status == 400)
                return !orgContext.showOTPModal && setFormErrors({ ...resBody.validationErrors });

            if (res.status == 409)
                return !orgContext.showOTPModal && setFormErrors({ ...resBody });

            if (res.status == 500)
                return alertContext.alertHandler("error", "Something Went Wrong.");
        }
    }

    return (
        <OrgContext.Provider value={{
            profile: state.profile,
            projects: state.projects,
            tasks: state.tasks,
            teams: state.teams,
            members: state.members,
            projEditData: state.projEditData,
            newTask: state.newTask,
            taskEditData: state.taskEditData,
            teamEditData: state.teamEditData,
            showAddProjModal: state.showAddProjModal,
            showEditProjModal: state.showEditProjModal,
            showAddTaskModal: state.showAddTaskModal,
            showAddTeamModal: state.showAddTeamModal,
            showEditTeamModal: state.showEditTeamModal,
            showInviteModal: state.showInviteModal,
            showOTPModal: state.showOTPModal,
            profileEditData: state.profileEditData,
            fetchOrgProfile,
            getScheduledTasksCount,
            fetchProjects,
            fetchOrgTasks,
            fetchTeams,
            fetchMembers,
            showAddProjUI,
            hideAddProjUI,
            showEditProjUI,
            hideEditProjUI,
            showAddTaskUI,
            hideAddTaskUI,
            showEditTaskUI,
            hideEditTaskUI,
            showAddTeamUI,
            hideAddTeamUI,
            showEditTeamUI,
            hideEditTeamUI,
            showInvitationUI,
            hideInvitationUI,
            setProfileEditData,
            profileUpdateHandler,
            showOTPUI,
            hideOTPUI
        }}>
            {props.children}
        </OrgContext.Provider>
    );
}

export default OrgState;
