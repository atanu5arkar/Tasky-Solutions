import { formatInTimeZone } from "date-fns-tz";
import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router";

import OrgContext from "./contexts/orgContext.jsx";
import AlertContext from "../Alert/alertContext.jsx";
import Loading from "../Loading.jsx";
import Alert from "../Alert/Alert.jsx";
import noContentImg from "../assets/images/no-content.png";

function Task({ data, team }) {
    const alertContext = useContext(AlertContext);
    const orgContext = useContext(OrgContext);

    const deadline = formatInTimeZone(data.deadline, "Asia/Kolkata", "dd MMM yyyy, hh:mm a");

    async function deleteTaskHandler(taskId) {
        try {
            const auth = localStorage.getItem("auth");

            const req = new Request(`/api/orgtasks/delete/${taskId}/${team._id}`, {
                method: "DELETE",
                headers: { auth }
            });

            var res = await fetch(req);
            if (!res.ok) throw new Error;

            alertContext.alertHandler("success", "Task deleted successfully.");
            return setTimeout(() => location.reload(), 200);

        } catch (error) {
            if (res.status == 500)
                return alertContext.alertHandler("error", "Something Went Wrong!");

            if (res.status == 401) {
                alertContext.alertHandler("error", "It seems you are not authorized for that.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                return setTimeout(() => location.href = "/login", 2000);
            }
        }
    }

    async function statusUpdateHandler(taskId) {
        try {
            const auth = localStorage.getItem("auth");

            const req = new Request(`/api/orgtasks/status/${taskId}/${team._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    auth
                },
                body: JSON.stringify({ status: !data.status })
            });

            var res = await fetch(req);
            if (!res.ok) throw new Error();

            alertContext.alertHandler("success", "The task status has been updated.");
            setTimeout(() => location.reload(), 100);

        } catch (error) {
            if (res.status == 500)
                return alertContext.alertHandler("error", "Something Went Wrong.");

            if (res.status == 401) {
                alertContext.alertHandler("error", "It seems you are not authorized for that.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                return setTimeout(() => location.href = "/login", 2000);
            }
        }
    }

    return (
        <div className="flex flex-col gap-y-6 rounded-md shadow-md p-4 font-[Inter] bg-white border border-gray-300">

            {/* Edit and delete btns */}
            <div className="flex justify-end *:cursor-pointer">
                <div>
                    <button
                        type="button"
                        className="px-2 rounded cursor-pointer"
                        onClick={() => orgContext.showEditTaskUI(data)}
                    >
                        <i className="fa-solid fa-pen fa-sm"></i>
                    </button>
                </div>
                <div>
                    <button
                        type="button"
                        className="px-2 rounded cursor-pointer"
                        onClick={() => deleteTaskHandler(data._id)}
                    >
                        <i className="fa-solid fa-trash fa-xs"></i>
                    </button>
                </div>
            </div>

            {/* Task */}
            <p className="text-xl font-semibold">{data.task}</p>

            {/* Deadline */}
            <p className="text-sm flex gap-x-2 items-center border-y border-gray-300 py-1.5">
                <i className="fa-solid fa-clock fa-lg "></i>
                <span className="font-medium"> {deadline} </span>
            </p>

            {/* Status and alertType */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <p className={`text-sm font-medium px-4 py-1 rounded-full self-end ${data.status ? "bg-lime-200 text-lime-700" : "bg-red-100 text-red-600"}`}>
                        <span>
                            {
                                data.status ? "Completed" : "Pending"
                            }
                        </span>
                    </p>
                    <button
                        type="button"
                        className="px-2 rounded cursor-pointer"
                        onClick={() => statusUpdateHandler(data._id)}
                    >
                        <i className="fa-solid fa-arrows-rotate text-gray-600"></i>
                    </button>
                </div>

                <p className="text-sm font-medium rounded-full px-4 py-1 bg-blue-100 flex items-center gap-x-2">
                    <i className="fa-regular fa-bell"></i>
                    <span className=""> {data.alertType.toUpperCase()} </span>
                </p>
            </div>
        </div>
    );
}

function Project({ data }) {
    const [teamAssigned, setTeamAssigned] = useState({ team: "" });
    const orgContext = useContext(OrgContext);
    const alertContext = useContext(AlertContext);

    let team = null;
    if (data.team) team = orgContext.teams.find(obj => obj._id == data.team);

    const teamOptions = orgContext.teams.map(team => (
        <option value={team._id} key={team._id}>{team.name}</option>
    ));
    const orgTasks = orgContext.tasks.filter(task => task.project == data._id);

    function teamChangeHandler(ev) {
        setTeamAssigned({ team: ev.target.value });
    }

    async function projDeleteHandler(projId) {
        try {
            const req = new Request(`/api/projects/delete/${projId}`, {
                method: "DELETE",
                headers: {
                    auth: localStorage.getItem("auth")
                }
            });
            var res = await fetch(req);
            if (!res.ok) throw new Error();

            alertContext.alertHandler("success", "Project Deleted Successfully.");
            setTimeout(() => location.reload(), 1000);

        } catch (error) {
            if (res.status == 500)
                return alertContext.alertHandler("error", "Something Went Wrong.");

            if (res.status == 401) {
                alertContext.alertHandler("error", "Your token is expired.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                return setTimeout(() => location.href = "/login", 2000);
            }
        }
    }

    async function assignTeamHandler(projId) {
        try {
            if (teamAssigned.team == "") return;

            const req = new Request(`/api/projects/update/${projId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    auth: localStorage.getItem("auth")
                },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    team: teamAssigned.team
                })
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();

            alertContext.alertHandler("success", "The Team is On Board.");
            setTimeout(() => location.reload(), 1000);

        } catch (error) {
            if (res.status == 500)
                return alertContext.alertHandler("error", "Something Went Wrong.");

            if (res.status == 401) {
                alertContext.alertHandler("error", "Your token is expired.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                return setTimeout(() => location.href = "/login", 2000);
            }
        }
    }

    return (
        <div className="bg-gray-50 border border-gray-300/50 rounded-md shadow-sm p-4 grid grid-rows-[auto_1fr] gap-y-6">

            <div className="flex flex-col gap-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        {
                            team
                                ? <p className="bg-green-200 rounded px-4 py-1.5 font-semibold">{team.name}</p>
                                : (
                                    <div className="flex items-center gap-x-3 text-sm">
                                        <select
                                            name="team"
                                            id="team"
                                            value={teamAssigned.team}
                                            onChange={teamChangeHandler}
                                            className="bg-white px-2 py-1 border border-gray-500 rounded-md focus:outline-none"
                                            placeholder="Choose team"
                                        >
                                            <option value="" disabled hidden>Assign Team</option>
                                            {teamOptions}
                                        </select>
                                        <button
                                            type="button"
                                            className={teamAssigned.team ? `cursor-pointer` : "cursor-not-allowed"}
                                            onClick={() => assignTeamHandler(data._id)}
                                        >
                                            <i className="fa-solid fa-floppy-disk fa-xl"></i>
                                        </button>
                                    </div>
                                )
                        }
                    </div>

                    <div className="flex items-center gap-x-3">
                        <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => {
                                const { title, description, team, _id: projId } = data;
                                orgContext.showEditProjUI({ title, description, team, projId })
                            }}
                        >
                            <i className="fa-solid fa-pen-to-square fa-lg"></i>
                        </button>

                        <button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => projDeleteHandler(data._id)}
                        >
                            <i className="fa-solid fa-circle-xmark fa-lg"></i>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-y-4">
                    <p className="font-[Lora] pb-2 border-b border-gray-400/60 text-3xl">{data.title}</p>
                    <p className="text-sm lg:text-base">{data.description}</p>
                </div>
            </div>

            {
                team
                &&
                (
                    orgTasks.length
                        ? (
                            <div className="overflow-auto flex flex-col gap-y-6">
                                <div className="flex justify-between items-center">
                                    <p className="bg-gray-300/60 px-6 rounded py-1 font-semibold">
                                        Your Tasks
                                    </p>
                                    <button
                                        type="button"
                                        className="cursor-pointer bg-gray-700 rounded border border-gray-700 text-white px-4 py-1 hover:rounded-full"
                                        onClick={() => orgContext.showAddTaskUI({ projId: data._id, teamId: team._id })}
                                    >
                                        Create
                                    </button>
                                </div>

                                <div className=" overflow-auto grid grid-cols-[repeat(auto-fit,minmax(300px,max-content))] gap-4 max-h-100">
                                    {
                                        orgTasks.map(task =>
                                            <Task
                                                key={task._id}
                                                data={task}
                                                team={team}
                                            />
                                        )
                                    }
                                </div>
                            </div>
                        )
                        : (
                            <div
                                className="flex flex-wrap justify-center items-center font-[Lora] font-medium text-2xl pt-4 cursor-pointer"
                                onClick={() => orgContext.showAddTaskUI({ projId: data._id, teamId: team._id })}
                            >
                                <p className="animate-pulse">
                                    Click Anywhere
                                </p>

                                <figure className="w-75">
                                    <img src={noContentImg} alt="" />
                                </figure>

                                <p className="animate-pulse">
                                    Time to Tasky...
                                </p>
                            </div>
                        )
                )
            }
        </div>
    )
}

function ProjectList() {
    const [loading, setLoading] = useState(true);
    const orgContext = useContext(OrgContext);
    const alertContext = useContext(AlertContext);

    useEffect(() => {
        async function getTaskData() {
            try {
                const auth = localStorage.getItem("auth");
                if (!auth) return location.href = "/login";

                await orgContext.fetchOrgTasks(auth);
                setLoading(false);

            } catch (error) {
                setLoading(false);
                console.log(error);
            }
        }
        getTaskData();
    }, []);

    if (loading) return (
        <figure className="grow flex justify-center items-center">
            <Loading />
        </figure>
    );

    return (
        <div className="overflow-auto flex flex-col grow gap-y-1 px-3 pt-4 lg:px-0">

            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <h1 className="font-[Lora] text-4xl lg:text-5xl"> 
                        Your <span className="text-green-600">Projects </span>
                    </h1>
                    <p
                        className="brand-btn px-3 py-2 text-sm lg:text-base"
                        onClick={() => orgContext.showAddProjUI()}
                    >
                        New One
                    </p>
                </div>
                <div className="min-h-10">
                    {
                        !orgContext.showAddProjModal
                        &&
                        !orgContext.showEditProjModal
                        &&
                        !orgContext.showAddTaskModal
                        &&
                        !orgContext.taskEditData
                        &&
                        <Alert />
                    }
                </div>
            </div>

            <div className="overflow-auto pb-4 flex flex-col gap-4 lg:pr-4">
                {
                    orgContext.projects.map(proj =>
                        <Project
                            key={proj._id}
                            data={proj}
                        />
                    )
                }
            </div>
        </div>
    );
}

export { ProjectList };