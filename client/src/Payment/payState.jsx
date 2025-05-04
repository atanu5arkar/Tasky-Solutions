import { useReducer } from "react";

import PaymentContext from "./payContext.jsx";
import paymentReducer from "./payReducer.jsx";

function PaymentState(props) {
    const initialState = {
        userCreds: null,
        amountModal: false
    }
    const [state, dispatch] = useReducer(paymentReducer, initialState);

    function showAmountModal(data) {
        dispatch({ type: "SET_USER", payload: data });
    }

    function hideAmountModal() {
        dispatch({ type: "RESET_USER" });
    }

    return (
        <PaymentContext.Provider value={{
            userCreds: state.userCreds,
            amountModal: state.amountModal,
            showAmountModal,
            hideAmountModal
        }}>
            {props.children}
        </PaymentContext.Provider>
    );
}

export default PaymentState;
