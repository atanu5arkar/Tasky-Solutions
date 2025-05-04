import Razorpay from "razorpay";
import { createHmac } from "node:crypto";

const { RZP_KEY_ID, RZP_KEY_SECRET } = process.env;

const razorpay = new Razorpay({
    key_id: RZP_KEY_ID,
    key_secret: RZP_KEY_SECRET
});

async function createRzpOrder(req, res) {
    try {
        const { amount, currency } = req.body;
        const response = await razorpay.orders.create({ amount, currency });
        return res.status(200).json(response);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Server Error." });
    }
}

async function verifyRzpPayment(req, res, next) {
    try {
        const { order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const hmac = createHmac("sha256", RZP_KEY_SECRET);
        hmac.update(`${order_id}|${razorpay_payment_id}`);
        const generatedSign = hmac.digest("hex");

        if (generatedSign == razorpay_signature) return next();

        return res.status(400).json({ msg: "Payment Verification Failed" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Server Error." });
    }
}

export {
    createRzpOrder,
    verifyRzpPayment
}