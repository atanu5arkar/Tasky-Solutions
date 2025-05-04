import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router";

import AlertContext from "../Alert/alertContext.jsx";
import Alert from "../Alert/Alert.jsx";
import OrgContext from "./contexts/orgContext.jsx";
import timeImg from "../assets/images/time-illustration.png";

function EditProject() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        team: ''
    });
    const [formErrors, setFormErrors] = useState({});

    const alertContext = useContext(AlertContext);
    const orgContext = useContext(OrgContext);

    const { projEditData, showEditProjModal, teams } = orgContext;

    useEffect(() => {
        if (!showEditProjModal) return;
        setFormData({ ...projEditData })
    }, [projEditData, showEditProjModal]);

    function onChangeHandler(ev) {
        const { name, value } = ev.target;
        return setFormData({ ...formData, [name]: value });
    }

    async function editProjectHandler(ev) {
        try {
            ev.preventDefault();
            const auth = localStorage.getItem("auth");

            const req = new Request(`/api/projects/update/${formData.projId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    auth
                },
                body: JSON.stringify(formData)
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();

            setFormData({ title: "", description: "", team: "" });
            setFormErrors({});

            alertContext.alertHandler("success", "Project edited successfully.");
            setTimeout(() => location.href = "/org/projects", 1000);

        } catch (error) {
            if (res.status == 500)
                return alertContext.alertHandler("error", "Something Went Wrong!");

            if (res.status == 401) {
                alertContext.alertHandler("error", "You are not authorized for that.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                return setTimeout(() => location.href = "/login", 2000);
            }
            
            if (res.status == 400) {
                return setFormErrors({ ...resBody.validationErrors });
            }
        }
    }

    if (!showEditProjModal) return;

    const teamOptions = teams.map(team => (
        <option value={team._id} key={team._id}>{team.name}</option>
    ));

    return (
        <div className="fixed z-2 w-screen h-screen bg-black/60 flex justify-center items-center">

            <div className="font-[Inter] space-y-1 bg-white p-6 px-4 rounded-lg w-9/10 md:w-1/2 md:px-6 lg:w-7/20">
                <div className="space-y-1">
                    <h1 className="font-[Lora] font-medium text-3xl lg:text-4xl">Edit Project</h1>
                    <div className="min-h-10"> <Alert /> </div>
                </div>

                <div className="space-y-6 2xl:space-y-8">
                    <form id="schedule" className="flex flex-col gap-y-4" onSubmit={editProjectHandler}>
                        <div>
                            <label htmlFor="title" className="text-sm font-semibold">Title:</label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                value={formData.title}
                                onChange={onChangeHandler}
                                className="user-input w-full"
                                autoComplete="off"
                                required
                            />
                            <p className="text-xs text-red-500 font-medium">{formErrors.title}</p>
                        </div>

                        <div>
                            <label htmlFor="team" className="text-sm font-semibold">Team:</label>
                            <div className="relative">
                                <select
                                    name="team"
                                    id="team"
                                    value={formData.team}
                                    onChange={onChangeHandler}
                                    className="user-input appearance-none w-full"
                                >
                                    {teamOptions}
                                </select>
                                <i className="fa-solid fa-caret-down absolute top-5 right-6"></i>
                            </div>
                            <p className="text-xs text-red-500 font-medium">{formErrors.team}</p>
                        </div>

                        <div>
                            <label htmlFor="description" className="text-sm font-semibold">Description:</label>
                            <textarea
                                name="description"
                                id="description"
                                value={formData.description}
                                onChange={onChangeHandler}
                                className="user-input w-full text-sm min-h-30"
                                placeholder="Tell us a bit about it"
                            >
                            </textarea>
                            <p className="text-xs text-red-500 font-medium">{formErrors.description}</p>
                        </div>
                    </form>

                    <div className="flex justify-between *:px-5 *:py-2 text-base">
                        <button type="submit" form="schedule" className="brand-btn2">Submit</button>
                        <button type="button" className="brand-btn2" onClick={() => orgContext.hideEditProjUI()}>
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>

    );
}

function NewProject() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
    });
    const [formErrors, setFormErrors] = useState({});
    const alertContext = useContext(AlertContext);
    const orgContext = useContext(OrgContext);
    const navigate = useNavigate();

    function onChangeHandler(ev) {
        const { name, value } = ev.target;
        return setFormData({ ...formData, [name]: value });
    }

    async function addProjectHandler(ev) {
        try {
            ev.preventDefault();
            const auth = localStorage.getItem("auth");

            const req = new Request("/api/projects/add", {
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

            setFormData({ title: "", description: "" });
            setFormErrors({});

            alertContext.alertHandler("success", "New project added successfully.");
            setTimeout(() => location.href = "/org/projects", 1000);

        } catch (error) {
            if (res.status == 500)
                return alertContext.alertHandler("error", "Something Went Wrong!");

            if (res.status == 401) {
                alertContext.alertHandler("error", "You are not authorized for that.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                setTimeout(() => location.href = "/login", 2000);
            }
            else if (res.status == 400) {
                setFormErrors({ ...resBody.validationErrors });
            }
        }
    }

    if (!orgContext.showAddProjModal) return;

    return (
        <div className="fixed z-2 w-screen h-screen bg-black/60 flex justify-center items-center">

            <div className="font-[Inter] space-y-1 bg-white p-6 px-4 rounded-lg w-9/10 md:w-1/2 md:px-6 lg:w-7/20">
                <div className="space-y-1">
                    <h1 className="font-[Lora] font-medium text-3xl lg:text-4xl">Create a Project</h1>
                    <div className="min-h-10"> <Alert /> </div>
                </div>

                <div className="space-y-6 2xl:space-y-8">
                    <form id="schedule" className="flex flex-col gap-y-6" onSubmit={addProjectHandler}>
                        <div>
                            <label htmlFor="title" className="text-sm font-semibold">Title:</label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                value={formData.title}
                                onChange={onChangeHandler}
                                className="user-input w-full"
                                autoComplete="off"
                                required
                            />
                            <p className="text-xs text-red-500 font-medium">{formErrors.title}</p>
                        </div>

                        <div>
                            <label htmlFor="description" className="text-sm font-semibold">Description:</label>
                            <textarea
                                name="description"
                                id="description"
                                value={formData.description}
                                onChange={onChangeHandler}
                                className="user-input w-full text-sm min-h-30"
                                placeholder="Tell us a bit about it"
                            >
                            </textarea>
                            <p className="text-xs text-red-500 font-medium">{formErrors.description}</p>
                        </div>
                    </form>

                    <div className="flex justify-between *:px-5 *:py-2 text-base">
                        <button type="submit" form="schedule" className="brand-btn2">Submit</button>
                        <button type="button" className="brand-btn2" onClick={() => orgContext.hideAddProjUI()}>
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>

    );
}

function AddProjBtn() {
    const orgContext = useContext(OrgContext);

    return (
        <div
            className="grow text-center cursor-pointer bg-top bg-repeat-y px-3 pt-8"
            style={{
                backgroundImage: `url(${timeImg})`
            }}
            onClick={() => orgContext.showAddProjUI()}
        >
            <div className="space-y-12 lg:space-y-8">
                <h1 className="font-[Lora] text-[38px] leading-12 lg:text-5xl lg:leading-10" >
                    Ready for a new <span className="text-green-600">Project?</span>
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

export { NewProject, AddProjBtn, EditProject };
