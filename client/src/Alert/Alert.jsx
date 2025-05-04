import { useContext } from "react";

import AlertContext from "./alertContext.jsx";

function Alert() {
    const alertContext = useContext(AlertContext);
    if (!alertContext.alert) return;

    const { type, msg } = alertContext.alert;

    return (
        <p className={`
            px-4 py-2 font-medium text-sm
            ${type == "error" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
        >
            {
                type == "error"
                    ? <><i className="fa-solid fa-circle-exclamation text-red-500"></i> {msg}</>
                    : <><i className="fa-solid fa-circle-check text-green-500"></i> {msg}</>
            }
        </p>
    );
}

export default Alert;
