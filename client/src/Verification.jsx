import { useEffect, useState } from "react";
import { useSearchParams, useParams, useNavigate, Outlet, useLocation, Link } from "react-router";

import Loading from "./Loading.jsx";

function AlreadyVerified() {
    const { type } = useParams();

    return (
        <div className="text-center space-y-6">
            <div className="flex gap-x-4 justify-center items-center">
                <h1 className="font-black text-6xl 2xl:text-7xl">Yo!</h1>
                <i className="fa-solid fa-arrows-rotate fa-2x animate-spin"></i>
            </div>

            <p className="font-medium text-lg text-gray-600">
                Why are you here?<br />
                Your stuff has been verified already.
            </p>

            {
                type != "member"
                &&
                <Link to="/login" className="font-semibold text-blue-700 rounded-full ring px-6 py-2 hover:bg-blue-100/60">
                    Log In
                </Link>
            }
        </div>
    );
}

function Error() {
    return (
        <div className="text-center space-y-6">
            <i className="fa-solid fa-skull-crossbones fa-3x text-red-300/70 animate-bounce"></i>
            <h1 className="font-black text-6xl 2xl:text-7xl">Shoot!</h1>

            <p className="font-medium text-lg text-gray-600">
                I hate to break it to you<br />
                Your link is either invalid or has expired.
            </p>

            <Link to="/" className="font-semibold text-blue-700 rounded-full ring px-4 py-2 hover:bg-blue-100/50">
                Go Home
            </Link>
        </div>
    );
}

function Success() {
    const { type } = useParams();

    return (
        <div className="text-center space-y-6">
            <i class="fa-solid fa-champagne-glasses text-blue-400 fa-3x animate-pulse"></i>
            <h1 className="font-black text-6xl 2xl:text-7xl">Whee!</h1>

            <p className="font-medium text-lg text-gray-600">
                Verification Successful.<br />
                Time for us to deliver your deadlines.
            </p>

            {
                type != "member"
                &&
                <Link to="/login" className="font-semibold text-blue-700 rounded-full ring px-6 py-2 hover:bg-blue-100/60">
                    Log In
                </Link>
            }
        </div>
    );
}

function Verification() {
    const [loading, setLoading] = useState(true);
    const { type } = useParams();
    const [query] = useSearchParams();
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const
        email = query.get("email"),
        phone = query.get("phone"),
        token = query.get("token");

    useEffect(() => {
        async function verificationHandler() {
            try {
                if (!["user", "org", "member"].includes(type) || !token || !email)
                    return navigate("/not-found");

                if (!email && !phone)
                    return navigate("/not-found");

                let phoneQuery = new URLSearchParams();
                phoneQuery.append("phone", phone);

                const req = new Request(`/api/${type == "member" ? "org/member" : type}/verify-links?email=${email}&${phone ? ("&" + phoneQuery) : ""}&token=${token}`, {
                    method: "GET"
                });
                var res = await fetch(req);
                var resBody = await res.json();

                if (!res.ok) throw new Error();
                navigate(`${pathname}/success`);
                setLoading(false);

            } catch (error) {
                if (res.status == 400) navigate(`${pathname}/error`);
                else if (res.status == 409) navigate(`${pathname}/conflict`);
                setLoading(false);
            }
        }
        verificationHandler();
    }, []);

    if (loading) return (
        <figure className="h-screen flex justify-center items-center">
            <Loading />
        </figure>
    );

    return (
        <section className="flex justify-center items-center h-screen font-[Inter] bg-gray-100">
            <Outlet />
        </section>
    );
}

export {
    Verification,
    AlreadyVerified,
    Error,
    Success
};
