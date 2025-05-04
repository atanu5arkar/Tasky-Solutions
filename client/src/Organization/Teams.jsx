import { useContext, useEffect, useRef, useState } from "react";
import Select from "react-select";

import OrgContext from "./contexts/orgContext.jsx";
import AlertContext from "../Alert/alertContext.jsx";
import Alert from "../Alert/Alert.jsx";

function EditTeam() {
    const [editData, setEditData] = useState({
        teamId: '',
        name: '',
        members: [],
    });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const selectRef = useRef(null);
    const modalRef = useRef(null);

    const alertContext = useContext(AlertContext);
    const orgContext = useContext(OrgContext);
    const { teamEditData, showEditTeamModal, members } = orgContext;

    const memberOptions = members
        .filter(({ isVerified }) => isVerified.email && isVerified.phone)
        .map(mem => ({
            value: mem._id,
            label: mem.name[0].toUpperCase() + mem.name.slice(1),
        }));

    useEffect(() => {
        function modalClickHandler(ev) {
            !selectRef.current.contains(ev.target) && setIsMenuOpen(false);
        }
        if (isMenuOpen)
            modalRef.current.addEventListener("click", modalClickHandler);
        else
            modalRef.current?.removeEventListener("click", modalClickHandler);

    }, [isMenuOpen]);

    useEffect(() => {
        if (teamEditData && showEditTeamModal) {
            const { team, name, members } = teamEditData;
            setEditData({
                teamId: team,
                name,
                members: members.map(mem => mem._id)
            });
        }
    }, [teamEditData, showEditTeamModal]);

    function onChangeHandler(ev) {
        return setEditData({
            ...editData,
            [ev.target.name]: ev.target.value
        });
    }

    function handleMembersChange(selected) {
        const memIds = selected.map(select => select.value);
        setEditData({
            ...editData,
            members: memIds
        });
    }

    if (!showEditTeamModal) return;

    async function editTeamHandler(ev) {
        try {
            ev.preventDefault();
            const auth = localStorage.getItem("auth");

            const req = new Request(`/api/teams/update/${editData.teamId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    auth
                },
                body: JSON.stringify(editData)
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();

            setEditData({ team: "", name: "", members: [] });
            setFormErrors({});
            setIsMenuOpen(false);

            alertContext.alertHandler("success", "Team edited successfully.");
            setTimeout(() => location.href = "/org/teams", 500);

        } catch (error) {
            if (res.status == 500) {
                setFormErrors({});
                return alertContext.alertHandler("error", "Something Went Wrong!");
            }

            if (res.status == 401) {
                alertContext.alertHandler("error", "You are not authorized for that.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                return setTimeout(() => location.href = "/login", 2000);
            }

            if (res.status == 400)
                return setFormErrors({ ...resBody.validationErrors });
        }
    }

    return (
        <div className="fixed z-2 w-screen h-screen bg-black/60 flex justify-center items-center" ref={modalRef}>

            <div
                className="font-[Inter] flex flex-col gap-y-4 bg-white p-6 px-4 rounded-lg w-9/10 md:w-1/2 md:px-6 lg:w-7/20 2xl:7/10"
            >
                <div className="space-y-1">
                    <h1 className="font-[Lora] font-medium text-3xl lg:text-4xl">Edit Team</h1>
                    <div className="min-h-10"> <Alert /> </div>
                </div>

                <form id="schedule" className="flex flex-col gap-y-6 h-3/5" onSubmit={editTeamHandler}>
                    <div>
                        <label htmlFor="name" className="text-sm font-semibold">Name:</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={editData.name}
                            onChange={onChangeHandler}
                            className="user-input w-full"
                            autoComplete="off"
                            required
                        />
                        <p className="text-xs text-red-500 font-medium">{formErrors.name}</p>
                    </div>

                    <div className="flex flex-col gap-y-2 overflow-auto">
                        <p className="text-sm font-semibold">Members:</p>

                        <div ref={selectRef}>
                            <Select
                                isMulti
                                options={memberOptions}
                                value={memberOptions.filter(option => editData.members.includes(option.value))}
                                onChange={handleMembersChange}
                                onFocus={() => setIsMenuOpen(true)}
                                className="w-full text-sm border border-gray-300 rounded-md"
                                menuPosition="fixed"
                                menuIsOpen={isMenuOpen}
                                placeholder="Choose members"
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        paddingTop: '0.5rem',
                                        paddingBottom: '0.5rem',
                                        backgroundColor: "#f9fafb",
                                        boxShadow: 'none',
                                        '&:focus': { boxShadow: 'none' }
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        zIndex: 3,
                                        pointerEvents: "auto",
                                        maxHeight: "10rem",
                                        overflowY: "auto"
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isSelected ? '#e5e7eb' : '#ffffff',
                                        '&:hover': {
                                            backgroundColor: '#dbeafe',
                                        },

                                    }),
                                }}
                            />
                        </div>
                        <p className="text-xs text-red-500 font-medium">{formErrors.members}</p>
                    </div>
                </form>

                <div className="flex justify-between *:px-5 *:py-2 text-base">
                    <button type="submit" form="schedule" className="brand-btn2">Submit</button>
                    <button
                        type="button"
                        className="brand-btn2"
                        onClick={() => {
                            orgContext.hideEditTeamUI()
                            setIsMenuOpen(false)
                        }}>
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}

function NewTeam() {
    const [formData, setFormData] = useState({
        name: '',
        members: [],
    });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const selectRef = useRef(null);
    const modalRef = useRef(null);

    const alertContext = useContext(AlertContext);
    const orgContext = useContext(OrgContext);

    const memberOptions = orgContext.members
        .filter(({ isVerified }) => isVerified.email && isVerified.phone)
        .map(mem => ({
            value: mem._id,
            label: mem.name[0].toUpperCase() + mem.name.slice(1),
        }));

    useEffect(() => {
        function modalClickHandler(ev) {
            !selectRef.current.contains(ev.target) && setIsMenuOpen(false);
        }
        if (isMenuOpen)
            modalRef.current.addEventListener("click", modalClickHandler);
        else
            modalRef.current?.removeEventListener("click", modalClickHandler);

    }, [isMenuOpen]);

    function onChangeHandler(ev) {
        return setFormData({
            ...formData,
            [ev.target.name]: ev.target.value
        });
    }

    function handleMembersChange(selected) {
        const memIds = selected.map(select => select.value);
        setFormData({
            ...formData,
            members: memIds
        });
    }

    async function addTeamHandler(ev) {
        try {
            ev.preventDefault();
            const auth = localStorage.getItem("auth");

            const req = new Request("/api/teams/add", {
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

            setFormData({ name: "", members: [] });
            setFormErrors({});
            setIsMenuOpen(false);

            alertContext.alertHandler("success", "New team added successfully.");
            setTimeout(() => {
                location.href = "/org/teams";
            }, 500);

        } catch (error) {
            if (res.status == 500) {
                setFormErrors({});
                return alertContext.alertHandler("error", "Something Went Wrong!");
            }

            if (res.status == 401) {
                alertContext.alertHandler("error", "Your token has expired.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                return setTimeout(() => location.href = "/login", 2000);
            }

            if (res.status == 400)
                return setFormErrors({ ...resBody.validationErrors });
        }
    }

    if (!orgContext.showAddTeamModal) return;

    return (
        <div className="fixed z-2 w-screen h-screen bg-black/60 flex justify-center items-center" ref={modalRef}>

            <div
                className="font-[Inter] flex flex-col gap-y-4 bg-white p-6 px-4 rounded-lg w-9/10 md:w-1/2 md:px-6 lg:w-7/20 2xl:7/10"
            >
                <div className="space-y-1">
                    <h1 className="font-[Lora] font-medium text-3xl lg:text-4xl">Create a Team</h1>
                    <div className="min-h-10"> <Alert /> </div>
                </div>

                <form id="schedule" className="flex flex-col gap-y-6 h-3/5" onSubmit={addTeamHandler}>
                    <div>
                        <label htmlFor="name" className="text-sm font-semibold">Name:</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={onChangeHandler}
                            className="user-input w-full"
                            autoComplete="off"
                            required
                        />
                        <p className="text-xs text-red-500 font-medium">{formErrors.name}</p>
                    </div>

                    <div className="flex flex-col gap-y-2 overflow-auto">
                        <p className="text-sm font-semibold">Members:</p>

                        <div ref={selectRef}>
                            <Select
                                isMulti
                                options={memberOptions}
                                value={memberOptions.filter(option => formData.members.includes(option.value))}
                                onChange={handleMembersChange}
                                onFocus={() => setIsMenuOpen(true)}
                                className="w-full text-sm border border-gray-300 rounded-md"
                                menuPosition="fixed"
                                menuIsOpen={isMenuOpen}
                                placeholder="Choose members"
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        paddingTop: '0.5rem',
                                        paddingBottom: '0.5rem',
                                        backgroundColor: "#f9fafb",
                                        boxShadow: 'none',
                                        '&:focus': { boxShadow: 'none' }
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        zIndex: 3,
                                        pointerEvents: "auto",
                                        maxHeight: "10rem",
                                        overflowY: "auto"
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isSelected ? '#e5e7eb' : '#ffffff',
                                        '&:hover': {
                                            backgroundColor: '#dbeafe',
                                        },

                                    }),
                                }}
                            />
                        </div>
                        <p className="text-xs text-red-500 font-medium">{formErrors.members}</p>
                    </div>
                </form>

                <div className="flex justify-between *:px-5 *:py-2 text-base">
                    <button type="submit" form="schedule" className="brand-btn2">Submit</button>
                    <button
                        type="button"
                        className="brand-btn2"
                        onClick={() => {
                            orgContext.hideAddTeamUI()
                            setIsMenuOpen(false)
                        }}>
                        Go Back
                    </button>
                </div>
            </div>
        </div>

    );
}

function Team({ data }) {
    const orgContext = useContext(OrgContext);
    const alertContext = useContext(AlertContext);

    const projects = orgContext.projects.filter(proj => proj.team == data._id);
    let { members } = data;
    members = orgContext.members.filter(memObj => members.includes(memObj._id));

    async function deleteTeamHandler(teamId) {
        try {
            const auth = localStorage.getItem("auth");

            const req = new Request(`/api/teams/delete/${teamId}`, {
                method: "DELETE",
                headers: { auth }
            });

            var res = await fetch(req);
            if (!res.ok) throw new Error;

            alertContext.alertHandler("success", "Team has been deleted successfully.");
            setTimeout(() => location.reload(), 1000);

        } catch (error) {
            if (res.status == 500)
                return alertContext.alertHandler("error", "Something Went Wrong! Try Again Later.");

            if (res.status == 401) {
                alertContext.alertHandler("error", "It seems you are not authorized for that.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                return setTimeout(() => location.href = "/login", 2000);
            }
        }
    }

    return (
        <div className="flex flex-col gap-y-4 rounded-md shadow-sm p-4 font-[Inter] bg-gray-50 border border-gray-300/50">

            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-y-1">
                    {/* Edit and delete btns */}
                    <div className="flex *:cursor-pointer">
                        <div>
                            <button
                                type="button"
                                className="px-2 rounded cursor-pointer"
                                onClick={() => orgContext.showEditTeamUI({ team: data._id, name: data.name, members })}
                            >
                                <i className="fa-solid fa-pen fa-sm"></i>
                            </button>
                        </div>
                        <div>
                            <button
                                type="button"
                                className="px-2 rounded cursor-pointer"
                                onClick={() => deleteTeamHandler(data._id)}
                            >
                                <i className="fa-solid fa-trash fa-xs"></i>
                            </button>
                        </div>
                    </div>
                    <p className="text-2xl font-[Lora]">{data.name}</p>
                </div>

                <div>
                    {
                        projects.length
                            ? <i className="fa-solid fa-gear fa-4x animate-spin text-green-200"></i>
                            : <i className="fa-solid fa-bed fa-4x text-red-200"></i>
                    }
                </div>
            </div>

            <div className="text-sm space-y-1">
                <p className="font-semibold">Working On: </p>
                {
                    projects.length
                        ? <p>{projects.map(proj => proj.title).join(" | ")}</p>
                        : <p className="text-red-500">Got nothing to do.</p>
                }
            </div>

            <div className="space-y-1">
                <div className="flex flex-wrap gap-x-2 text-sm">
                    <p className="font-semibold text-sm">Members:</p>
                    {
                        members.map(mem =>
                            <p className="bg-lime-200 rounded-full px-3 py-0.5" key={mem._id}>
                                {mem.name[0].toUpperCase() + mem.name.slice(1)}
                            </p>
                        )
                    }
                </div>
            </div>
        </div>
    );
}

function TeamList() {
    const orgContext = useContext(OrgContext);

    return (
        <div className="overflow-auto flex flex-col grow gap-y-1 px-3 pt-4 lg:px-0">

            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <h1 className="font-[Lora] text-4xl"> Your Teams </h1>
                    <p
                        className="brand-btn px-3 py-2 text-sm lg:text-base"
                        onClick={() => orgContext.showAddTeamUI()}
                    >
                        Create Team
                    </p>
                </div>

                <div className="min-h-10">
                    {
                        !orgContext.showAddTeamModal
                        &&
                        !orgContext.showEditTeamModal
                        &&
                        <Alert />
                    }
                </div>
            </div>

            <div className="overflow-auto grid grid-cols-[repeat(auto-fit,minmax(300px,max-content))] pb-4 gap-4 lg:pr-4">
                {
                    orgContext.teams.map(team =>
                        <Team
                            data={team}
                            key={team._id}
                        />
                    )
                }
            </div>
        </div>
    );

}

export { TeamList, NewTeam, EditTeam };
