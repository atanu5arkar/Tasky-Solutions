import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router";

import AlertContext from "../Alert/alertContext.jsx";
import Alert from "../Alert/Alert.jsx";
import UserContext from "./contexts/userContext.jsx";
import timeImg from "../assets/images/time-illustration.png";

function Schedule() {
    const [formData, setFormData] = useState({
        task: '',
        deadline: '',
        alertType: 'email'
    });
    const [formErrors, setFormErrors] = useState({});
    const alertContext = useContext(AlertContext);
    const userContext = useContext(UserContext);
    const navigate = useNavigate();

    function onChangeHandler(ev) {
        const { name, value } = ev.target;
        return setFormData({ ...formData, [name]: value });
    }

    async function addTaskHandler(ev) {
        try {
            ev.preventDefault();
            const auth = localStorage.getItem("auth");

            const req = new Request("/api/tasks/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    auth
                },
                body: JSON.stringify(formData)
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();

            setFormData({ task: '', deadline: '', alertType: 'email' });
            setFormErrors({});

            alertContext.alertHandler("success", "New tasky added successfully.");

            setTimeout(() => {
                userContext.hideScheduleUI();
                navigate("/user/tasks");
                location.reload();
            }, 1000);

        } catch (error) {
            if (res.status == 500)
                return alertContext.alertHandler("error", "Something Went Wrong! Try Again Later.");

            if (res.status == 401) {
                alertContext.alertHandler("error", "It seems you are not authorized for that.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                setTimeout(() => navigate("/login"), 3000);
            }
            else if (res.status == 400) {
                setFormErrors({ ...resBody.validationErrors });
            }
        }
    }

    if (!userContext.showAddModal) return;

    return (
        <div className="fixed z-2 w-screen h-screen bg-black/60 flex justify-center items-center">

            <div className="font-[Inter] space-y-1 bg-white p-6 px-4 rounded-lg w-9/10 md:w-1/2 md:px-6 lg:w-7/20">
                <div className="space-y-1">
                    <h1 className="font-[Lora] font-medium text-3xl lg:text-4xl">Schedule a Tasky</h1>
                    <div className="min-h-10"> <Alert /> </div>
                </div>

                <div className="space-y-6 2xl:space-y-8">
                    <form id="schedule" className="flex flex-col gap-y-6" onSubmit={addTaskHandler}>
                        <div>
                            <label htmlFor="task" className="text-sm font-semibold">New Task:</label>
                            <input
                                type="text"
                                name="task"
                                id="task"
                                value={formData.task}
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
                                value={formData.deadline}
                                onChange={onChangeHandler}
                                className="user-input w-full"
                                required
                            />
                            <p className="text-xs text-red-500 font-medium">{formErrors.deadline}</p>
                        </div>
                        <div>
                            <label htmlFor="alertType" className="text-sm font-semibold">Alert Type:</label>
                            <div className="relative">
                                <select
                                    name="alertType"
                                    id="alertType"
                                    value={formData.alertType}
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
                    </form>

                    <div className="flex justify-between *:px-5 *:py-2 text-base">
                        <button type="submit" form="schedule" className="brand-btn2">Tasky It!</button>
                        <button type="button" className="brand-btn2" onClick={() => userContext.hideScheduleUI()}>
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>

    );
}

function AddTaskBtn() {
    const userContext = useContext(UserContext);

    return (
        <div
            className="grow text-center cursor-pointer bg-top bg-repeat-y px-3 pt-8"
            style={{
                backgroundImage: `url(${timeImg})`
            }}
            onClick={() => userContext.showScheduleUI()}
        >
            <div className="space-y-12 lg:space-y-8">
                <h1 className="font-[Lora] text-[38px] leading-12 lg:text-5xl lg:leading-10" >
                    Ready for a new <span className="text-green-600">Tasky?</span>
                </h1>
                <div className="space-y-2">
                    <p className="font-medium text-lg 2xl:text-xl text-gray-600">
                        Click Anywhere
                    </p>
                    <p className="animate-bounce text-gray-600 pt-2">
                        <i className="fa-solid fa-circle-arrow-up fa-3x"></i>
                    </p>
                </div>
            </div>
        </div>
    );
}

export { Schedule, AddTaskBtn };
