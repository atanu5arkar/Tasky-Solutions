function adminAuthentication(req, res, next) {
    const { auth } = req.headers;

    if (auth != process.env.ADMIN_AUTH)
        return res.status(401).json({ msg: 'Access Denied!' });

    return next();
}

export default adminAuthentication;