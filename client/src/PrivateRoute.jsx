import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

import Loading from "./Loading.jsx";

function PrivateRoute({ element: Component }) {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        async function authorizeClient() {
            try {
                const basepath = location.pathname.split("/")[1];
                const auth = localStorage.getItem("auth");

                if (!auth) {
                    setLoading(false);
                    return navigate("/login");
                }
                const req = new Request(`/api/${basepath}/auth`, {
                    method: "GET",
                    headers: { auth }
                });

                var res = await fetch(req);
                var resBody = await res.json();

                if (!res.ok) throw new Error();

                localStorage.setItem("userInfo", JSON.stringify({ ...resBody }));
                setLoading(false);
                setIsAuthenticated(true);
            } catch (error) {
                localStorage.removeItem("userInfo");
                setLoading(false);
            }
        }
        authorizeClient();
    }, []);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            localStorage.removeItem("userInfo");
            navigate("/login");
        }
    }, [loading]);

    if (loading) return (
        <figure className="h-screen flex justify-center items-center">
            <Loading />
        </figure>
    );

    return isAuthenticated && <Component />
}

export default PrivateRoute;
