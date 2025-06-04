const jwt = require('jsonwebtoken');
const ApiError = require('../error/ApiError');

const JWT_SECRET = process.env.SECRET_KEY || 'secret-key';

module.exports = function (req, res, next) {
    if (req.method === "OPTIONS") {
        next();
    }
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next(ApiError.unauthorized('Authorization header is missing. Please add "Authorization: Bearer YOUR_TOKEN"'));
        }

        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' || !token) {
            return next(ApiError.unauthorized('Invalid authorization header format. Use "Bearer YOUR_TOKEN"'));
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        if (e instanceof jwt.JsonWebTokenError) {
            return next(ApiError.unauthorized('Invalid token'));
        }
        if (e instanceof jwt.TokenExpiredError) {
            return next(ApiError.unauthorized('Token expired'));
        }
        return next(ApiError.unauthorized('Not authorized'));
    }
}; 