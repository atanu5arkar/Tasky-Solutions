function authorizeRequest(req, res, next) {
    const { auth } = req.headers;
    
    if (auth != process.env.API_KEY)
        return res.status(401).json({ msg: 'Unauthorized!' });
    return next();
}

export default authorizeRequest;