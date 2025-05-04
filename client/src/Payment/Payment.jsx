import { useContext, useState } from "react";

import PaymentContext from "./payContext.jsx";
import AlertContext from "../Alert/alertContext.jsx";
import Alert from "../Alert/Alert.jsx";

function Payment() {
    const [amount, setAmount] = useState("0");
    const paymentContext = useContext(PaymentContext);
    const alertContext = useContext(AlertContext);

    if (!paymentContext.amountModal) return;

    function onChangeHandler(ev) {
        const { value } = ev.target;
        if (value == " " || isNaN(value)) return;
        setAmount(value);
    }

    async function paymentVerificationHandler(payload) {
        try {
            const { type } = JSON.parse(localStorage.getItem("userInfo"));
            const auth = localStorage.getItem("auth");

            const req = new Request(`/api/${type}/verify-payment`, {
                method: "POST",
                headers: {
                    auth,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            var res = await fetch(req);
            if (!res.ok) throw new Error();

        } catch (error) {
            console.log(error);
        }
    }

    async function submitHandler(ev) {
        try {
            ev.preventDefault();
            if (amount == "") return;

            const { type } = JSON.parse(localStorage.getItem("userInfo"));
            const auth = localStorage.getItem("auth");

            const req = new Request(`/api/${type}/create-order`, {
                method: "POST",
                headers: {
                    auth,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    amount: Number(amount) * 100,
                    currency: "INR"
                })
            });

            var res = await fetch(req);
            var resBody = await res.json();

            if (!res.ok) throw new Error();

            const { amount: amt, currency, id } = resBody;
            const { name, email, phone } = paymentContext.userCreds;

            // Razorpay Checkout
            const options = {
                key: 'rzp_live_cSWZJc8TA0qQiR',
                amount: amt,
                currency,
                order_id: id,
                name: 'ATANU SARKAR',
                description: 'Tasky Credits',
                handler: async function (response) {
                    try {
                        const { razorpay_payment_id, razorpay_signature } = response;
                        await paymentVerificationHandler({
                            amount: amt,
                            order_id: id,
                            razorpay_payment_id,
                            razorpay_signature
                        });
                        location.reload(); // Refresh the cards
                    } catch (error) {
                        console.log(error);
                        alert("Payment Verification Failed!")
                    }
                },
                prefill: {
                    name,
                    email,
                    contact: phone
                },
                theme: {
                    color: '#1E90FF',
                },
            };

            const rzp = new window.Razorpay(options);

            rzp.on("payment.failed", () => {
                alert("Payment Failed.");
            });

            paymentContext.hideAmountModal();
            rzp.open();

        } catch (error) {
            if (res.status == 401) {
                alertContext.alertHandler("error", "Your token has expired.");
                localStorage.removeItem("auth");
                localStorage.removeItem("userInfo");
                return setTimeout(() => location.href = "/login", 2000);
            }
            if (res.status == 400)
                return alertContext.alertHandler("error", resBody.validationErrors.amount);

            return alertContext.alertHandler("error", "Something Went Wrong.");
        }
    }

    return (
        <div className="fixed z-2 w-screen h-screen bg-black/70 flex justify-center items-center">

            <div className="relative font-[Inter] space-y-2 bg-white p-6 px-4 rounded-lg w-9/10 md:w-1/2 md:px-6 lg:w-7/20">
                <div className="space-y-1">
                    <h1 className="font-[Lora] font-medium text-3xl lg:text-4xl">Enter Amount</h1>
                    <div className="min-h-10"> <Alert /> </div>
                </div>

                {/* Close Button */}
                <div className="absolute top-4 right-4">
                    <button
                        type="button"
                        className="cursor-pointer"
                        onClick={() => {
                            setAmount("0");
                            paymentContext.hideAmountModal();
                        }}
                    >
                        <i className="fa-regular fa-circle-xmark fa-xl text-gray-700"></i>
                    </button>
                </div>

                <div className="space-y-6">
                    <form className="flex gap-x-3 items-center justify-between" onSubmit={submitHandler}>
                        <p> <i className="fa-solid fa-indian-rupee-sign fa-xl"></i> </p>

                        <div className="grow">
                            <input
                                type="text"
                                name="amount"
                                id="amount"
                                value={amount}
                                onChange={onChangeHandler}
                                className="user-input w-full"
                                autoComplete="off"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="border text-white cursor-pointer bg-blue-400 hover:bg-blue-500 rounded-md py-4 px-6"
                        >
                            <i className="fa-solid fa-right-long"></i>
                        </button>
                    </form>

                    <p className="text-xs text-center text-blue-500 font-medium">
                        ** We accept payments upto &#x20B9;20 only. Every rupee is worth 10 credits.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Payment;
