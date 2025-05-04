import { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router";

import Loading from "./Loading.jsx";
import Alert from "./Alert/Alert.jsx";
import logo from "./assets/images/logo.png";
import loginImg from "./assets/images/productivity1.jpg";
import AlertContext from "./Alert/alertContext.jsx";

function Header({ showOtpUI }) {
    const commonClass = "text-2xl lg:text-3xl font-[Lora]";

    if (showOtpUI) return (
        <div className="space-y-4">
            <h1 className={commonClass}>Two-factor Authentication</h1>
            <div className="flex gap-x-2 items-center">
                <p><i className="fa-solid fa-shield-halved fa-lg animate-bounce"></i></p>
                <p className="text-lg 2xl:text-xl">Please enter your OTP</p>
            </div>
            <div className="min-h-9"> <Alert /> </div>
        </div>
    )

    return (
        <div className="space-y-4">
            <h1 className={commonClass}>Log in to your account</h1>
            <h2 className="lg:text-xl">
                Don't have an account?&nbsp;
                <Link to="/signup" className="text-blue-600 font-semibold hover:underline">Sign up</Link>
            </h2>
            <div className="min-h-9"> <Alert /> </div>
        </div>
    );
}

function Credentials({ userInfo, setUserInfo }) {
    const { email, password, type } = userInfo;

    function onChangeHandler(ev) {
        const { name, value } = ev.target;
        return setUserInfo({ ...userInfo, [name]: value });
    }

    return (
        <>
            <input
                type="email"
                name="email"
                value={email}
                onChange={onChangeHandler}
                placeholder="Email"
                className="user-input"
                required
            />
            <input
                type="password"
                name="password"
                value={password}
                onChange={onChangeHandler}
                placeholder="Password"
                className="user-input"
                required
            />

            <div className="flex justify-around *:flex *:space-x-2 my-2">
                <div>
                    <input
                        type="radio"
                        name="type"
                        id="individual"
                        value="user"
                        checked={type == "user"}
                        onChange={onChangeHandler}
                    />
                    <label htmlFor="individual">Individual</label>
                </div>

                <div>
                    <input
                        type="radio"
                        name="type"
                        id="org"
                        value="org"
                        checked={type == "org"}
                        onChange={onChangeHandler}
                    />
                    <label htmlFor="org">Organization</label>
                </div>
            </div>
        </>
    );
}

function OTP({ digits, setDigits, sendOTPHandler }) {
    const [count, setCount] = useState(59);
    const alertContext = useContext(AlertContext);
    const inputRefs = useRef([]);
    const inputFields = new Array(6).fill(0).map((e, i) =>
        <div className="basis-12 grow" key={i}>
            <input
                type="text"
                name={`d${i + 1}`}
                value={digits[`d${i + 1}`]}
                ref={ele => inputRefs.current.push(ele)}
                onChange={(ev) => onChangeHandler(ev, i + 1)}
                onPaste={onPasteHandler}
                maxLength="1"
                className="border border-gray-300 bg-gray-50 rounded-md w-full p-3 text-center focus:outline-1 focus:outline-blue-500"
                autoComplete="off"
                required
            />
        </div>
    );

    useEffect(() => {
        const timerId = setInterval(() => {
            setCount(count => {
                if (count == 0) {
                    clearInterval(timerId);
                    return count;
                }
                return count - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, []);

    async function handleResendOTP(ev) {
        try {
            await sendOTPHandler(ev);
            alertContext.alertHandler("success", "OTP Sent Successfully.");
        } catch (error) {
            console.log(error);
        }
    }

    function onChangeHandler(ev, next) {
        const { name, value } = ev.target;

        // Accept numbers only
        if (value == " " || isNaN(+value)) return;

        // Shift focus only when current is not empty
        if (value != '') {
            const ele = inputRefs.current[next];
            ele ? ele.focus() : inputRefs.current[0].focus();
        }
        return setDigits({ ...digits, [name]: value });
    }

    function onPasteHandler(ev) {
        const pasteData = ev.clipboardData.getData("Text");
        if (isNaN(parseInt(pasteData))) return;

        const newDigits = Object.keys(digits).reduce((acc, key, i) => {
            acc[key] = pasteData[i];
            return acc;
        }, {});
        setDigits({ ...newDigits });
        return inputRefs.current[5].focus();
    }

    return (
        <>
            <div className="flex justify-between gap-x-1 2xl:gap-x-3">
                {inputFields}
            </div>

            {
                count != 0
                    ? <p className="text-sm font-semibold"> Resend OTP in {count}</p>
                    : <Link onClick={handleResendOTP} className="text-sm text-blue-600 font-semibold hover:underline">
                        Click to Resend
                    </Link>
            }
        </>
    );
}

function Login() {
    const [loading, setLoading] = useState(true);
    const [showOtpUI, setShowOtpUI] = useState(false);
    const [userInfo, setUserInfo] = useState({ id: '', name: '', email: '', phone: '', password: '', type: 'user' });
    const [digits, setDigits] = useState({ d1: '', d2: '', d3: '', d4: '', d5: '', d6: '' });
    const navigate = useNavigate();
    const alertContext = useContext(AlertContext);

    useEffect(() => {
        function isLoggedIn() {
            const auth = localStorage.getItem("auth");
            const userInfo = localStorage.getItem("userInfo");
            if (!auth || !userInfo) return setLoading(false);

            try {
                const { type } = JSON.parse(userInfo);
                navigate(`/${type}`);
            } catch (error) {
                setLoading(false);
            }
        }
        isLoggedIn();
    }, []);

    async function sendOTPHandler(ev) {
        try {
            ev.preventDefault();

            const req = new Request(`/api/${userInfo.type}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userInfo)
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();

            const { [`${userInfo.type}Id`]: id, ...rest } = resBody;

            setUserInfo({ ...userInfo, id, ...rest });
            return setShowOtpUI(true);

        } catch (error) {
            if (res.status == 401)
                alertContext.alertHandler("error", resBody.msg);
            else
                alertContext.alertHandler("error", "Something Went Wrong!");
        }
    }

    async function loginHandler(ev) {
        try {
            ev.preventDefault();

            const otp = Object.values(digits).join('');
            const { email, name, phone, id } = userInfo;

            const req = new Request(`/api/${userInfo.type}/verify-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, otp, name, phone, [`${userInfo.type}Id`]: id })
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();

            localStorage.setItem("auth", resBody.token);
            return navigate(`/${userInfo.type}`);

        } catch (error) {
            if (res.status == 401)
                alertContext.alertHandler("error", resBody.msg);
            else
                alertContext.alertHandler("error", "Something Went Wrong!");
        }
    }

    if (loading) return (
        <figure className="h-screen flex justify-center items-center">
            <Loading />
        </figure>
    );

    return (
        <section className="max-w-screen-2xl mx-auto h-screen flex">

            <div className="w-full flex flex-col gap-y-6 justify-center px-6 lg:px-8 2xl:px-12 py-10 md:w-9/20 lg:w-7/20">

                <div className="space-y-8">
                    <Link to="/" className="w-32 inline-block">
                        <img src={logo} alt="Brand logo" className="w-full h-full object-cover" />
                    </Link>

                    <Header showOtpUI={showOtpUI} />
                </div>

                <form className="flex flex-col gap-y-4" id="login" onSubmit={showOtpUI ? loginHandler : sendOTPHandler}>
                    {
                        showOtpUI
                            ? <OTP
                                digits={digits}
                                setDigits={setDigits}
                                sendOTPHandler={sendOTPHandler}
                            />
                            : <Credentials
                                userInfo={userInfo}
                                setUserInfo={setUserInfo}
                            />
                    }
                </form>

                <button type="submit" form="login" className="brand-btn md:self-start py-2 px-8" >
                    {showOtpUI ? "Log In" : "Send OTP"}
                </button>
            </div>

            <figure className="hidden md:block md:grow">
                <img src={loginImg} alt="" className="w-full h-full object-cover" />
            </figure>
        </section>
    );
}

export default Login;
