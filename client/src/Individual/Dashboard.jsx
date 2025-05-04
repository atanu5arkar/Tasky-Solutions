import { useState, useContext, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";

import Loading from "../Loading.jsx";
import UserContext from "./contexts/userContext.jsx";
import logo from "../assets/images/logo.png";
import navImg from "../assets/images/nav-illustration.png";
import { Schedule } from "./AddTask.jsx";
import EditTask from "./EditTask.jsx";
import { CredUpdateOTP } from "./Profile.jsx";
import Payment from "../Payment/Payment.jsx";

function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [time, setTime] = useState({ hr: "", min: "", sec: "" });
    const [stats, setStats] = useState({ bells: 0, totTasks: 0, mails: 0, msgs: 0 });
    const navigate = useNavigate();

    const userContext = useContext(UserContext);
    const { alerts, tasks, credits } = userContext.profile ?? {};

    useEffect(() => {
        async function getProfileData() {
            try {
                const auth = localStorage.getItem("auth");
                if (!auth) return navigate("/login");

                await userContext.fetchUserProfile(auth);
                setLoading(false);
            } catch (error) {
                console.log(error);
                setLoading(false);
            }
        }
        getProfileData();
    }, []);

    useEffect(() => {
        if (loading || !userContext.profile) return;

        const timerId = setInterval(() => {
            setStats(stats => {
                const { email, sms } = credits
                const { bells, totTasks, mails, msgs } = stats;

                if (bells == alerts && totTasks == tasks.length && mails == email && msgs == sms) {
                    clearInterval(timerId);
                    return stats;
                }
                return {
                    bells: bells == alerts ? alerts : bells + 1,
                    totTasks: totTasks == tasks.length ? tasks.length : totTasks + 1,
                    mails: mails == email ? email : mails + 1,
                    msgs: msgs == sms ? sms : msgs + 1,
                }
            });
        }, 8);
    }, [loading, userContext.profile]);

    useEffect(() => {
        if (loading || !userContext.profile) return;

        const today = new Date();
        const
            hr = today.getHours(),
            min = today.getMinutes(),
            sec = today.getSeconds();

        setTime({ hr, min, sec });

        const timerId = setInterval(() => {
            setTime(time => {
                let { hr, min, sec } = time;

                if (sec == 59) {
                    sec = 0;
                    min++;

                    if (min == 60) {
                        min = 0;
                        hr++;
                    }
                    if (hr == 24) {
                        hr = 0;
                    }
                    return { hr, min, sec };
                }

                return { hr, min, sec: sec + 1 }
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [loading, userContext.profile]);

    if (loading) return (
        <figure className="h-screen flex justify-center items-center">
            <Loading />
        </figure>
    );

    function logoutHandler() {
        localStorage.removeItem("auth");
        localStorage.removeItem("userInfo");
        return navigate("/login");
    }

    return (
        <>
            <Schedule />
            <EditTask />
            <CredUpdateOTP />
            <Payment />

            <section className="max-h-screen max-w-screen-2xl mx-auto grid md:grid-cols-[15%_1fr] 2xl:w-17/20">

                {/* Sidebar */}
                <div
                    className={`border-r border-gray-100 h-screen z-1 bg-black/60 fixed pointer-events-auto transition delay-150 ${showSidebar ? "opacity-100" : "opacity-0 pointer-events-none md:pointer-events-auto"} md:static md:opacity-100`}
                    onClick={() => setShowSidebar(false)}
                >
                    <aside className={`bg-white w-3/5 h-full flex flex-col gap-y-10 items-center py-6 transition delay-200 ${showSidebar ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:w-full`}>

                        <figure className="w-32">
                            <img src={logo} alt="Brand logo" className="w-full h-full object-cover" />
                        </figure>

                        <div className="grow flex flex-col justify-around lg:justify-between">

                            <nav className="font-[Inter] font-medium flex flex-col items-center gap-y-8 *:flex *:items-center *:gap-x-2">
                                <NavLink to="/user">
                                    <i className="fa-solid fa-house text-gray-600"></i>Home
                                </NavLink>

                                <NavLink to="/user/tasks">
                                    <i className="fa-solid fa-list-check text-gray-600"></i>Tasks
                                </NavLink>

                                <NavLink to="/user/profile">
                                    <i className="fa-solid fa-user text-gray-600"></i>Profile
                                </NavLink>
                            </nav>

                            <figure className="w-full">
                                <img src={navImg} alt="" className="w-full h-full object-cover" />
                            </figure>
                        </div>
                    </aside>
                </div>

                <div className="h-screen flex flex-col bg-white">

                    <div className="flex justify-between items-center px-3 py-5 border-b border-gray-200 lg:p-6">

                        {/* Hamburger Button */}
                        <div className="md:hidden">
                            <button type="button" className="border border-gray-400 rounded px-2.5 py-1.5 text-[" onClick={() => setShowSidebar(true)}>
                                <i className="fa-solid fa-bars fa-xl"></i>
                            </button>
                        </div>

                        <h1 className="font-bold text-2xl">
                            Hey {userContext.profile.name[0].toUpperCase() + userContext.profile.name.slice(1)}
                        </h1>

                        <div className="flex items-center gap-x-10">
                            <h1 className="hidden font-[Lora] font-medium text-xl grow md:block">
                                {String(time.hr).padStart(2, '0')}
                                &nbsp; : {String(time.min).padStart(2, '0')}
                                &nbsp; : {String(time.sec).padStart(2, '0')}
                                <span> IST</span>
                            </h1>
                            <button type="button" className="brand-btn px-3 py-2" onClick={logoutHandler}>Log Out</button>
                        </div>
                    </div>

                    <div className="grow flex flex-col gap-y-4 pb-0 overflow-auto lg:p-6">

                        {/* Statistics Cards */}
                        <div className="font-[Inter] p-3 pb-0 flex flex-wrap justify-around *:grow *:basis-38 gap-4 lg:p-0">

                            <div className="flex justify-between rounded-md p-3 shadow-md bg-gray-50 md:p-4">
                                <div className="flex flex-col justify-between">
                                    <p className="font-black text-5xl lg:text-6xl 2xl:text-7xl"> {stats.totTasks} </p>
                                    <p className="font-medium text-sm md:text-base">Tasks Scheduled</p>
                                </div>
                                <p>
                                    <i className="fa-solid fa-bars-progress fa-2x text-blue-400"></i>
                                </p>
                            </div>

                            <div className="flex justify-between rounded-md p-3 shadow-md bg-gray-50 md:p-4">
                                <div className="flex flex-col justify-between">
                                    <p className="font-black text-5xl lg:text-6xl 2xl:text-7xl"> {stats.bells} </p>
                                    <p className="font-medium text-sm md:text-base">Notifications Sent</p>
                                </div>
                                <p>
                                    <i className="fa-solid fa-bell fa-2x text-amber-400"></i>
                                </p>
                            </div>

                            <div className="flex justify-between rounded-md p-3 shadow-md bg-gray-50 md:p-4">

                                <div className="flex flex-col justify-between">
                                    <p className="font-black text-5xl lg:text-6xl 2xl:text-7xl"> {stats.mails} </p>
                                    <p className="font-medium text-sm md:text-base">Email Credits</p>
                                </div>
                                <p><i className="fa-solid fa-comment-dollar fa-2x text-red-400"></i></p>
                            </div>

                            <div className="flex justify-between rounded-md p-3 shadow-md bg-gray-50 md:p-4">

                                <div className="flex flex-col justify-between">
                                    <p className="font-black text-5xl lg:text-6xl 2xl:text-7xl"> {stats.msgs} </p>
                                    <p className="font-medium text-sm md:text-base">SMS Credits</p>
                                </div>
                                <p><i className="fa-solid fa-comments-dollar fa-2x text-lime-500"></i></p>
                            </div>
                        </div>

                        <Outlet />
                    </div>
                </div>
            </section>
        </>
    );
}

export default Dashboard;
