import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router";

import logo2 from "./assets/images/logo2.png";
import AlertContext from "./Alert/alertContext.jsx";
import Alert from "./Alert/Alert.jsx";

function Signup() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        type: 'user'
    });
    const [formErrors, setFormErrors] = useState({});
    const navigate = useNavigate();
    const alertContext = useContext(AlertContext);

    function onChangeHandler(ev) {
        const { name, value } = ev.target;
        return setFormData({ ...formData, [name]: value });
    }

    async function signupHandler(ev) {
        try {
            ev.preventDefault();

            // Attach the country code
            const phone = "+91" + formData.phone.trim();

            const req = new Request(`/api/${formData.type}/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ ...formData, phone })
            });
            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error("Something went wrong");

            alertContext.alertHandler("success", "Registered Successfully.");
            setFormErrors({});
            setTimeout(() => navigate("/login"), 3000);

        } catch (error) {
            if (res.status == 409)
                setFormErrors({ email: 'This Email is already registered.' });
            else if (res.status == 400)
                setFormErrors({ ...resBody.validationErrors });
            else
                alertContext.alertHandler("error", "Something Went Wrong");
        }
    }

    return (
        <section className="min-h-screen py-6 2xl:py-8 bg-[#023430]">

            <div className="w-full max-w-screen-2xl mx-auto flex flex-col items-center gap-y-10">

                {/* Back to Landing */}
                
                <Link to="/" className="w-34">
                    <img src={logo2} alt="Brand logo" className="w-full h-full object-cover" />
                </Link>

                {/* Signup form */}

                <div className="bg-white w-19/20 px-6 py-8 space-y-4 rounded-2xl md:w-3/5 md:p-8 md:rounded-4xl lg:w-2/5 2xl:px-10 2xl:w-7/20">
                    <div className="space-y-3 text-center">
                        <h1 className="font-[Lora] text-3xl">Sign Up</h1>
                        <p className="text-lg font-medium">Experience Tasky for free.</p>
                        <Alert />
                    </div>

                    <form className="flex flex-col gap-y-4 my-8" onSubmit={signupHandler}>
                        <div>
                            <p className="text-xs px-1 text-red-500 font-medium">{formErrors.name}</p>
                            <input
                                type="text"
                                name="name"
                                placeholder="Name"
                                value={formData.name}
                                onChange={onChangeHandler}
                                className="user-input w-full"
                                required
                            />
                        </div>

                        <div>
                            <p className="text-xs px-1 text-red-500 font-medium">{formErrors.email}</p>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={onChangeHandler}
                                className="user-input w-full"
                                required
                            />
                        </div>

                        <div>
                            <p className="text-xs px-1 text-red-500 font-medium">{formErrors.phone}</p>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Phone No."
                                value={formData.phone}
                                onChange={onChangeHandler}
                                className="user-input w-full"
                                required
                            />
                        </div>

                        <div>
                            <p className="text-xs px-1 text-red-500 font-medium">{formErrors.password}</p>
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={onChangeHandler}
                                className="user-input w-full"
                                required
                            />
                        </div>

                        <div>
                            <p className="text-xs px-1 text-red-500 font-medium">{formErrors.confirmPassword}</p>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Re-enter password"
                                value={formData.confirmPassword}
                                onChange={onChangeHandler}
                                className="user-input w-full"
                                required
                            />
                        </div>

                        <div className="flex justify-around my-4 *:flex *:space-x-2">
                            <div>
                                <input
                                    type="radio"
                                    name="type"
                                    id="individual"
                                    value="user"
                                    onChange={onChangeHandler}
                                    checked={formData.type == "user"}
                                />
                                <label htmlFor="individual">Individual</label>
                            </div>
                            <div>
                                <input
                                    type="radio"
                                    name="type"
                                    id="org"
                                    value="org"
                                    onChange={onChangeHandler}
                                    checked={formData.type == "org"}
                                />
                                <label htmlFor="org">Organization</label>
                            </div>
                        </div>

                        <button type="submit" className="brand-btn py-3">Create your Tasky account</button>
                    </form>

                    <div className="text-center">
                        <Link to="/login" className="text-[#001E2B] font-medium hover:underline">Log in</Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Signup;
