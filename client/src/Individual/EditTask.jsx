import { useContext, useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";

import Alert from "../Alert/Alert.jsx";
import UserContext from "./contexts/userContext.jsx";
import AlertContext from "../Alert/alertContext.jsx";

function EditTask() {
    const userContext = useContext(UserContext);

    const alertContext = useContext(AlertContext);
    const { editData, showEditModal } = userContext;

    const [formErrors, setFormErrors] = useState({});
    const [data, setData] = useState({ task: "", deadline: "", alertType: "email", status: "pending" });

    useEffect(() => {
        if (editData && showEditModal) {
            const { task, deadline, alertType, status } = editData;
            setData({
                task,
                alertType,
                deadline: formatInTimeZone(deadline, "Asia/Kolkata", "yyyy-MM-dd'T'HH:mm"),
                status: status ? "completed" : "pending"
            });
        }
    }, [editData, showEditModal]);

    if (!showEditModal) return;

    function onChangeHandler(ev) {
        const { name, value } = ev.target;
        setData({ ...data, [name]: value });
    }

    async function editTaskHandler(ev) {
        try {
            ev.preventDefault();
            const auth = localStorage.getItem("auth");

            const req = new Request(`/api/tasks/update/${editData._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    auth
                },
                body: JSON.stringify({ ...data })
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();

            setData({ task: '', deadline: '', alertType: 'email' });
            setFormErrors({});
            alertContext.alertHandler("success", "Tasky edited successfully.");
            setTimeout(() => location.reload(), 500);

        } catch (error) {
            if (res.status == 500)
                return alertContext.alertHandler("error", "Something Went Wrong! Try Again Later.");

            if (res.status == 401) {
                alertContext.alertHandler("error", "It seems you are not authorized for that.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                return setTimeout(() => navigate("/login"), 3000);
            }

            if (res.status == 400)
                return setFormErrors({ ...resBody.validationErrors });
        }
    }

    return (
        <div className="fixed z-2 w-screen h-screen bg-black/60 flex justify-center items-center">

            <div className="font-[Inter] space-y-1 bg-white p-6 rounded-lg w-4/5 md:w-1/2 lg:w-7/20">

                <div className="space-y-1">
                    <h1 className="font-[Lora] font-bold text-3xl lg:text-4xl">Edit Tasky</h1>
                    <div className="min-h-10"> <Alert /> </div>
                </div>

                <div className="space-y-6 2xl:space-y-8">
                    <form id="editTaskForm" className="flex flex-col gap-y-6">
                        <div>
                            <label htmlFor="task" className="text-sm font-semibold">New Task:</label>
                            <input
                                type="text"
                                name="task"
                                id="task"
                                value={data.task}
                                onChange={onChangeHandler}
                                className="user-input w-full"
                                autoComplete="off"
                                required
                            />
                            <p className="text-xs text-red-500 font-medium">{formErrors.task}</p>
                        </div>
                        <div>
                            <label htmlFor="deadline" className="text-sm font-semibold">Deadline:</label>
                            <input
                                type="datetime-local"
                                name="deadline"
                                id="deadline"
                                value={data.deadline}
                                onChange={onChangeHandler}
                                className="user-input w-full"
                                required
                            />
                            <p className="text-xs text-red-500 font-medium">{formErrors.deadline}</p>
                        </div>
                        
                        <div className="flex gap-x-4 *:grow">
                            <div>
                                <label htmlFor="alertType" className="text-sm font-semibold">Alert Type:</label>
                                <div className="relative">
                                    <select
                                        name="alertType"
                                        id="alertType"
                                        value={data.alertType}
                                        onChange={onChangeHandler}
                                        className="user-input appearance-none w-full"
                                    >
                                        <option value="sms">SMS</option>
                                        <option value="email">Email</option>
                                        <option value="both">Both</option>
                                    </select>
                                    <i className="fa-solid fa-caret-down absolute top-5 right-6"></i>
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="status" className="text-sm font-semibold">Status:</label>
                                <div className="relative">
                                    <select
                                        name="status"
                                        id="status"
                                        value={data.status}
                                        onChange={onChangeHandler}
                                        className="user-input appearance-none w-full"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                    <i className="fa-solid fa-caret-down absolute top-5 right-6"></i>
                                </div>
                            </div>
                        </div>
                    </form>

                    <div className="flex justify-between *:px-4 *:py-2">
                        <button type="submit" form="editTaskForm" className="brand-btn2" onClick={editTaskHandler}>Save</button>
                        <button type="button" className="brand-btn2" onClick={() => userContext.hideEditTaskUI()}>Go Back</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditTask;
