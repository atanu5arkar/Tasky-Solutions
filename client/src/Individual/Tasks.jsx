import { formatInTimeZone } from "date-fns-tz";
import { useState, useContext, useEffect } from "react";

import UserContext from "./contexts/userContext.jsx";
import Loading from "../Loading.jsx";
import Alert from "../Alert/Alert.jsx";
import AlertContext from "../Alert/alertContext.jsx";
import { useNavigate } from "react-router";

function Task({ data }) {
    const alertContext = useContext(AlertContext);
    const userContext = useContext(UserContext);
    const navigate = useNavigate();

    const deadline = formatInTimeZone(data.deadline, "Asia/Kolkata", "dd MMM yyyy, hh:mm a");

    async function deleteTaskHandler(taskId) {
        try {
            const auth = localStorage.getItem("auth");

            const req = new Request(`/api/tasks/delete/${taskId}`, {
                method: "DELETE",
                headers: { auth }
            });

            var res = await fetch(req);
            if (!res.ok) throw new Error;

            alertContext.alertHandler("success", "Your Task has been deleted successfully.");
            setTimeout(() => location.reload(), 1000);

        } catch (error) {
            if (res.status == 500)
                alertContext.alertHandler("error", "Something Went Wrong! Try Again Later.");

            if (res.status == 401) {
                alertContext.alertHandler("error", "It seems you are not authorized for that.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                setTimeout(() => navigate("/login"), 3000);
            }
        }
    }

    async function statusUpdateHandler(taskId) {
        try {
            const auth = localStorage.getItem("auth");

            const req = new Request(`/api/tasks/status/${taskId}`, {
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
            setTimeout(() => location.reload(), 500);

        } catch (error) {
            if (res.status == 500)
                return alertContext.alertHandler("error", "Something Went Wrong! Try Again Later.");

            if (res.status == 401) {
                alertContext.alertHandler("error", "It seems you are not authorized for that.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                setTimeout(() => navigate("/login"), 3000);
            }
        }
    }

    return (
        <div className="flex flex-col gap-y-6 rounded-md shadow-sm p-4 font-[Inter] bg-gray-50 border border-gray-300/50">

            {/* Edit and delete btns */}
            <div className="flex justify-end *:cursor-pointer">
                <div>
                    <button
                        type="button"
                        className="px-2 rounded cursor-pointer"
                        onClick={() => userContext.showEditTaskUI(data)}
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

function TaskList() {
    const [loading, setLoading] = useState(true);
    const userContext = useContext(UserContext);

    useEffect(() => {
        async function getTaskData() {
            try {
                const auth = localStorage.getItem("auth");
                if (!auth) return navigate("/login");

                await userContext.fetchUserTasks(auth);
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
        <div className="overflow-auto flex flex-col grow gap-y-2 px-3 pt-4 lg:px-0">

            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <h1 className="font-[Lora] text-4xl lg:text-5xl"> Your <span className="text-green-600">Tasks</span> </h1>
                    <p
                        className="brand-btn px-3 py-2"
                        onClick={() => userContext.showScheduleUI()}
                    >
                        Add One
                    </p>
                </div>
                {
                    !userContext.showEditModal
                    && !userContext.showAddModal
                    && <div className="min-h-10"> <Alert /> </div>
                }
            </div>

            <div className="overflow-auto grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] pb-4 gap-4 lg:pr-4">
                {
                    userContext.tasks.map(task =>
                        <Task
                            data={task}
                            key={task._id}
                        />
                    )
                }
            </div>
        </div>
    );
}

export default TaskList;
