import { Link } from "react-router";

function NotFound() {
    return (
        <section className="h-screen flex justify-center items-center">
            <div className="font-[Inter] text-center space-y-6 xl:space-y-8">
                <h1 className="text-7xl xl:text-8xl font-black text-blue-700">404</h1>
                
                <p className="font-medium text-lg">
                    Are you lost?<br /> We don't have the stuff you want.
                </p>
                
                <Link to="/" className="font-semibold text-blue-700 rounded-full ring px-4 py-2 hover:bg-blue-100/60">
                    Go Home
                </Link>
            </div>
        </section>
    );
}

export default NotFound;
