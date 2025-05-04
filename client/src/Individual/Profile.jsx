import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import UserContext from "./contexts/userContext.jsx";
import accImg from "../assets/images/account-illustration.png";
import AlertContext from "../Alert/alertContext.jsx";
import Alert from "../Alert/Alert.jsx";
import PaymentContext from "../Payment/payContext.jsx";

function CredUpdateOTP() {
    const alertContext = useContext(AlertContext);
    const userContext = useContext(UserContext);

    const [digits, setDigits] = useState({ d1: '', d2: '', d3: '', d4: '', d5: '', d6: '' });
    const [count, setCount] = useState(59);

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
        if (!userContext.showOTPModal) return;

        setCount(59);

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
    }, [userContext.showOTPModal]);

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

    async function handleResendOTP() {
        try {
            await userContext.profileUpdateHandler({ userContext, alertContext })
            alertContext.alertHandler("success", "OTP Sent Successfully.");
        } catch (error) {
            alertContext.alertHandler("error", "Something Went Wrong!");
        }
    }

    async function otpSubmitHandler() {
        try {
            const otp = Object.values(digits).join('');

            const req = new Request(`/api/user/update/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    auth: localStorage.getItem("auth")
                },
                body: JSON.stringify({ otp, ...userContext.profileEditData })
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();

            alertContext.alertHandler("success", "Successful! Redirecting to Log In...");
            localStorage.removeItem("auth");
            localStorage.removeItem("userInfo");
            return setTimeout(() => location.href = "/login", 2000);

        } catch (error) {
            if (res.status == 401) {
                alertContext.alertHandler("error", "You are not authorized for that.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                return setTimeout(() => location.href = "/login", 1000);
            }
            if (res.status == 400)
                return alertContext.alertHandler("error", resBody.msg);

            if (res.status == 500)
                return alertContext.alertHandler("error", "Something Went Wrong!");
        }
    }

    if (!userContext.showOTPModal) return;

    return (
        <div className="fixed z-2 w-screen h-screen bg-black/60 flex justify-center items-center">

            <div className="font-[Inter] space-y-3 bg-white p-6 rounded-lg w-4/5 md:w-1/2 lg:w-7/20">

                <div className="space-y-1">
                    <h1 className="text-lg lg:text-xl font-[Lora]">Please enter your OTP</h1>
                    <div className="min-h-9"> <Alert /> </div>
                </div>

                <div className="flex justify-between gap-x-1 2xl:gap-x-3">
                    {inputFields}
                </div>

                <div>
                    {
                        count != 0
                            ? <p className="text-sm font-semibold"> Resend OTP in {count}</p>
                            : <Link onClick={handleResendOTP} className="text-sm text-red-500 font-semibold hover:underline">
                                Click to Resend
                            </Link>
                    }
                </div>

                <div className="flex justify-between *:px-4 *:py-2">
                    <button
                        type="submit"
                        className="brand-btn2"
                        onClick={otpSubmitHandler}
                    >
                        Submit
                    </button>

                    <button
                        type="button"
                        className="brand-btn2"
                        onClick={() => location.reload()}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function Profile() {
    const userContext = useContext(UserContext);
    const alertContext = useContext(AlertContext);
    const paymentContext = useContext(PaymentContext);

    const [isEditing, setIsEditing] = useState({ email: false, phone: false });
    const [formErrors, setFormErrors] = useState({});

    const ref = useRef([]);

    const { name, email, phone, credits } = userContext.profile;
    const { newEmail, newPhone } = userContext.profileEditData;

    useEffect(() => {
        if (isEditing.email) ref.current[0].focus();
        else if (isEditing.phone) ref.current[1].focus();
        setFormErrors({});
    }, [isEditing]);

    function onChangeHandler(ev) {
        const { name, value } = ev.target;
        userContext.setProfileEditData({ ...userContext.profileEditData, [name]: value });
    }

    function handleProfileUpdate() {
        userContext.profileUpdateHandler({ setFormErrors, alertContext, userContext });
    }

    return (
        <div className="grow font-medium px-3 flex flex-col overflow-hidden md:flex-row md:items-center lg:px-0 md:gap-10">
            <figure className="order-1 w-full md:w-3/10 2xl:w-2/5">
                <img src={accImg} alt="w-full h-full object-cover" />
            </figure>

            <div className="grow space-y-2 2xl:space-y-5">
                <div className="space-y-1">
                    <h1 className="text-3xl 2xl:text-4xl font-[Lora]">Your Profile</h1>
                    <div className="md:min-h-10">
                        {
                            !userContext.showOTPModal
                            &&
                            !paymentContext.amountModal
                            &&
                            <Alert />
                        }
                    </div>
                </div>

                <div className="flex flex-col gap-y-1 md:flex-row md:items-center">
                    <p className="w-1/7"> Name: </p>
                    <p className="grow p-3 rounded-md bg-gray-100 border-1 border-gray-300">{name.toUpperCase()}</p>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-y-1 md:flex-row md:items-center">
                    <p className="w-1/7">Email:</p>

                    {
                        !isEditing.email
                            ? (
                                <div className="grow grid grid-cols-1">
                                    <p className="row-start-1 row-end-2 col-start-1 p-3 bg-gray-100 rounded-md border-1 border-gray-300">{email}</p>
                                    <div
                                        className="hidden row-start-1 row-end-2 col-start-1 self-center justify-self-end pr-4 cursor-pointer lg:block"
                                        onClick={() => {
                                            setIsEditing({ email: true, phone: false });
                                            userContext.setProfileEditData({ newPhone: '', newEmail: email })
                                        }}
                                    >
                                        <i className="fa-solid fa-pen-to-square fa-lg"></i>
                                    </div>
                                </div>
                            )
                            : (
                                <div className="grow grid grid-cols-1">
                                    <input
                                        type="email"
                                        name="newEmail"
                                        ref={ele => ref.current[0] = ele}
                                        value={newEmail}
                                        onChange={onChangeHandler}
                                        className="row-start-1 row-end-2 col-start-1 p-3 bg-gray-100 rounded-md border-1 border-gray-300 focus:outline-1"
                                        required
                                    />
                                    <p className="text-red-500 text-xs font-medium">{formErrors.newEmail}</p>

                                    <div className="row-start-1 row-end-2 col-start-1 self-center justify-self-end pr-4 cursor-pointer flex gap-x-3">
                                        <div onClick={handleProfileUpdate}>
                                            <i className="fa-solid fa-floppy-disk fa-lg"></i>
                                        </div>
                                        <div onClick={() => setIsEditing({ email: false, phone: false })}>
                                            <i className="fa-solid fa-xmark fa-lg"></i>
                                        </div>
                                    </div>
                                </div>
                            )
                    }
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-y-1 md:flex-row md:items-center">
                    <p className="w-1/7">Phone:</p>
                    {
                        !isEditing.phone
                            ? (
                                <div className="grow grid grid-cols-1">
                                    <p className="row-start-1 row-end-2 col-start-1 p-3 bg-gray-100 rounded-md border-1 border-gray-300">{phone}</p>
                                    <div
                                        className="hidden row-start-1 row-end-2 col-start-1 self-center justify-self-end pr-4 cursor-pointer lg:block"
                                        onClick={() => {
                                            setIsEditing({ email: false, phone: true });
                                            userContext.setProfileEditData({ newEmail: '', newPhone: phone })
                                        }}
                                    >
                                        <i className="fa-solid fa-pen-to-square fa-lg"></i>
                                    </div>
                                </div>
                            )
                            : (
                                <div className="grow grid grid-cols-1">
                                    <input
                                        type="tel"
                                        name="newPhone"
                                        ref={ele => ref.current[1] = ele}
                                        value={newPhone}
                                        onChange={onChangeHandler}
                                        className="row-start-1 row-end-2 col-start-1 p-3 bg-gray-100 rounded-md border-1 border-gray-300 focus:outline-1"
                                        required
                                    />
                                    <p className="text-red-500 text-xs font-medium">{formErrors.newPhone}</p>

                                    <div className="row-start-1 row-end-2 col-start-1 self-center justify-self-end pr-4 cursor-pointer flex gap-x-3">
                                        <div onClick={handleProfileUpdate}>
                                            <i className="fa-solid fa-floppy-disk fa-lg"></i>
                                        </div>
                                        <div onClick={() => setIsEditing({ email: false, phone: false })}>
                                            <i className="fa-solid fa-xmark fa-lg"></i>
                                        </div>
                                    </div>
                                </div>
                            )
                    }
                </div>

                <div className="flex flex-col gap-y-1 md:flex-row md:items-center">
                    <p className="w-1/7">Credits:</p>

                    <div className="flex items-center gap-x-5 *:text-center">
                        <p className="py-3 px-6 bg-gray-100 rounded-md border-1 border-gray-300">
                            <i className="fa-solid fa-at"></i> {credits.email}
                        </p>
                        <p className="py-3 px-6 bg-gray-100 rounded-md border-1 border-gray-300">
                            <i className="fa-solid fa-comment-sms fa-lg"></i> {credits.sms}
                        </p>
                        <button
                            type="button"
                            className="grow md:grow-0 brand-btn p-3"
                            onClick={() => paymentContext.showAmountModal({ name, email, phone })}
                        >
                            Add Credits
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export {
    Profile,
    CredUpdateOTP
};
