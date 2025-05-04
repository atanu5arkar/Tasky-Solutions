
function paymentReducer(state, action) {
    switch (action.type) {
        case "SET_USER":
            return {
                ...state,
                userCreds: action.payload,
                amountModal: true
            };

        case "RESET_USER":
            return {
                ...state,
                amountModal: false
            };

        default:
            return state;
    }
}

export default paymentReducer;