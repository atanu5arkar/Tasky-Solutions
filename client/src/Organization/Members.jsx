import { useContext, useState } from "react";

import OrgContext from "./contexts/orgContext.jsx";
import AlertContext from "../Alert/alertContext.jsx";
import Alert from "../Alert/Alert.jsx";

function MemberInvite() {
    const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
    const [formErrors, setFormErrors] = useState({});

    const orgContext = useContext(OrgContext);
    const alertContext = useContext(AlertContext);

    function onChangeHandler(e) {
        const { name, value } = e.target;
        return setFormData({ ...formData, [name]: value });
    }

    async function sendInviteHandler(ev) {
        try {
            ev.preventDefault();
            const auth = localStorage.getItem("auth");

            const phone = ("+91" + formData.phone.trim());

            const req = new Request("/api/org/member-invite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    auth
                },
                body: JSON.stringify({ ...formData, phone })
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();

            setFormData({ name: "", email: "", phone: "" });
            setFormErrors({});

            alertContext.alertHandler("success", "Invitation sent successfully.");
            setTimeout(() => location.reload(), 1000);

        } catch (error) {
            if (res.status == 500)
                return alertContext.alertHandler("error", "Something Went Wrong!");

            if (res.status == 401) {
                alertContext.alertHandler("error", "You are not authorized for that.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                return setTimeout(() => location.href = "/login", 2000);
            }

            if (res.status == 409)
                return alertContext.alertHandler("error", "The person has been invited already.");

            if (res.status == 400)
                return setFormErrors({ ...resBody.validationErrors });
        }
    }

    if (!orgContext.showInviteModal) return;

    return (
        <div className="fixed z-2 w-screen h-screen bg-black/60 flex justify-center items-center">

            <div className="font-[Inter] space-y-1 bg-white p-6 px-4 rounded-lg w-9/10 md:w-1/2 md:px-6 lg:w-3/10">
                <div className="space-y-1">
                    <h1 className="font-[Lora] font-medium text-3xl lg:text-4xl">Invitation</h1>
                    <div className="min-h-10"> <Alert /> </div>
                </div>

                <div className="space-y-6 2xl:space-y-8">
                    <form id="schedule" className="flex flex-col gap-y-6" onSubmit={sendInviteHandler}>
                        <div>
                            <input
                                type="text"
                                name="name"
                                placeholder="Name"
                                value={formData.name}
                                onChange={onChangeHandler}
                                className="user-input w-full"
                                required
                            />
                            <p className="text-xs px-1 text-red-500 font-medium">{formErrors.name}</p>
                        </div>

                        <div>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={onChangeHandler}
                                className="user-input w-full"
                                required
                            />
                            <p className="text-xs px-1 text-red-500 font-medium">{formErrors.email}</p>
                        </div>

                        <div>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Phone No."
                                value={formData.phone}
                                onChange={onChangeHandler}
                                className="user-input w-full"
                                required
                            />
                            <p className="text-xs px-1 text-red-500 font-medium">{formErrors.phone}</p>
                        </div>
                    </form>

                    <div className="flex justify-between *:px-5 *:py-2 text-base">
                        <button type="submit" form="schedule" className="brand-btn2 flex justify-center items-center gap-x-1">
                            <i className="fa-solid fa-paper-plane fa-lg"></i>
                            <span>Send</span>
                        </button>

                        <button type="button" className="brand-btn2" onClick={() => orgContext.hideInvitationUI()}>
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Member({ data }) {
    const { isVerified } = data;

    return (
        <div className="flex flex-col gap-y-2 rounded-md shadow-sm p-4 font-[Inter] bg-gray-50 border border-gray-300/50">

            <div className="flex flex-col text-xs">                
                <div className="self-end flex items-center gap-x-2">
                    <p className="font-semibold">Invitation:</p> 
                    {
                        (isVerified.email && isVerified.phone)
                            ? <p className="bg-lime-100 rounded-full px-3 py-0.5 text-green-600 ring font-medium">Accepted</p>
                            : <p className="bg-red-100 rounded-full px-3 py-0.5 text-red-500 ring font-medium">Pending</p>
                    }
                </div>
                <p className="text-xl font-bold">{data.name[0].toUpperCase() + data.name.slice(1)}</p>
            </div>

            {/* <p className="text-xl font-bold">{data.name[0].toUpperCase() + data.name.slice(1)}</p> */}
            
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-y-1">
                    <p className="flex items-center gap-x-2 text-sm">
                        <span><i className="fa-solid fa-envelope"></i></span>
                        <span>{data.email}</span>
                    </p>
                
                    <p className="flex items-center gap-x-2 text-sm">
                        <span><i className="fa-solid fa-mobile-screen-button fa-lg"></i></span>
                        <span>{data.phone}</span>
                    </p>
                </div>

                <figure className="w-18">
                    <img src={`https://avatar.iran.liara.run/username?username=${data.name}`} alt="" className="w-full h-full object-cover" />
                </figure>
            </div>
        </div>
    );
}

function MemberList() {
    const orgContext = useContext(OrgContext);

    return (
        <div className="overflow-auto flex flex-col grow gap-y-2 px-3 pt-4 lg:px-0">

            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <h1 className="font-[Lora] text-green-600 text-3xl lg:text-4xl"> Members </h1>
                    <p
                        className="brand-btn px-3 py-2"
                        onClick={() => orgContext.showInvitationUI()}
                    >
                        Invite One
                    </p>
                </div>
            </div>

            <div className="overflow-auto grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] pb-4 gap-4 lg:pr-4">
                {
                    orgContext.members.map(member =>
                        <Member
                            data={member}
                            key={member._id}
                        />
                    )
                }
            </div>
        </div>
    );
}

export { MemberList, MemberInvite };