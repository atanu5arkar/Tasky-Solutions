import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import logo from "./assets/images/logo.png";
import landingImg from "./assets/images/landing-page-illustration.png";

function LandingPage() {
    const words = ["Deadlines", "Efficiency", "Organization", "Productivity", "Timeliness"];

    const [copy, setCopy] = useState(words[0]);
    const [isFading, setIsFading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let count = words.length - 1;

        const id = setInterval(() => {
            setIsFading(true);

            setTimeout(() => {
                setIsFading(false);
                setCopy(words[count--]);
                if (count < 0) count = words.length - 1;
            }, 200);
        }, 3000);

        return () => clearInterval(id);
    }, []);

    return (
        <section className="max-w-screen-2xl mx-auto h-screen flex flex-col gap-y-10">

            {/* Header */}

            <div className="flex justify-between items-center p-6 border-b border-gray-300 2xl:p-8">
                <figure className="w-32">
                    <img src={logo} alt="Brand logo" className="w-full h-full object-cover" />
                </figure>

                <div>
                    <button type="button" className="brand-btn px-6 py-2" onClick={() => navigate("/login")}>Log In</button>
                </div>
            </div>

            {/* App Intro */}

            <div className="grow flex flex-col gap-6 p-6 justify-center md:flex-row md:justify-between md:items-start 2xl:p-8">

                <div className="font-[Inter] space-y-6 md:basis-11/20 md:shrink-0">
                    <h1 className="text-3xl md:text-5xl 2xl:text-6xl leading-12 md:leading-16 2xl:leading-20 font-[Lora]">
                        Loved by professionals.
                        <br />
                        Built for
                        <span className={`text-green-600 transition-opacity duration-200 ${isFading ? "opacity-0" : "opacity-100"}`}> {copy} </span>
                    </h1>

                    <p className="py-4 lg:text-xl">
                        No more losing yourself in the maze of Uncle Tick-Tock.
                        
                        <strong className="text-[#001E2B]"> Tasky </strong> keeps you glued to your schedule. A robust notifications system to deliver your deadlines, so you can be <span className="text-green-600 lowercase font-medium"> On Time Every Time.</span>
                    </p>

                    <div className="space-x-8 group">
                        <button
                            type="button"
                            className="brand-btn px-6 py-3 2xl:px-8"
                            onClick={() => navigate("/signup")}
                        >
                            Try Tasky Now
                        </button>
                        <i className="fa-solid fa-arrow-right fa-lg text-[#001E2B] transition duration-100 group-hover:translate-x-3"></i>
                    </div>
                </div>

                <figure className="-order-1 md:order-1">
                    <img src={landingImg} alt="" className="w-full h-full object-cover" />
                </figure>
            </div>
        </section>
    );
}

export default LandingPage;
