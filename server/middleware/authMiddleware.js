const jwt = require('jsonwebtoken');
const ApiError = require('../error/ApiError');
const { User } = require('../models/associations');

const JWT_SECRET = process.env.SECRET_KEY || 'secret-key';

module.exports = async function (req, res, next) {
    if (req.method === 'OPTIONS') {
        return next();
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next(ApiError.unauthorized('Authorization header is missing. Use "Authorization: Bearer YOUR_TOKEN"'));
        }

        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' || !token) {
            return next(ApiError.unauthorized('Invalid authorization format. Use "Bearer YOUR_TOKEN"'));
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded || !decoded.id) {
            return next(ApiError.unauthorized('Invalid token payload'));
        }

        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return next(ApiError.unauthorized('User not found'));
        }

        req.user = user.toJSON();
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
