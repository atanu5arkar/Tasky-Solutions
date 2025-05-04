import jwt from "jsonwebtoken";

function userAuthorization(req, res, next) {
    try {
        const { auth } = req.headers;
        if (!auth)
            return res.status(401).json({ msg: 'Access Denied!' });

        req.user = jwt.verify(auth, process.env.JWT_KEY);
        if (req.user.type != "user") throw new Error();
        return next();

    } catch (error) {
        return res.status(401).json({ msg: 'Invalid Token!' });
    }
}

export default userAuthorization;