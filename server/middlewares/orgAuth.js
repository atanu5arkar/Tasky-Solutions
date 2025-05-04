import jwt from "jsonwebtoken";

function orgAuthorization(req, res, next) {
    try {
        const { auth } = req.headers;
        if (!auth)
            return res.status(401).json({ msg: 'Access Denied!' });

        req.org = jwt.verify(auth, process.env.JWT_KEY);
        if (req.org.type != "org") throw new Error();
        return next();

    } catch (error) {
        return res.status(401).json({ msg: 'Invalid Token!' });
    }
}

export default orgAuthorization;