const ApiError = require('../error/ApiError');
const { translateError } = require('../error/errorMessage'); 

module.exports = function (err, req, res, next) {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        status: err.status,
        isApiError: err instanceof ApiError
    });

    if (err instanceof ApiError) {
        return res.status(err.status).json({
            message: translateError(err.message),
            status: err.status
        });
    }

    if (err.isJoi) {
        return res.status(400).json({
            message: translateError(err.details[0].message),
            status: 400
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            message: translateError('Invalid token'),
            status: 401
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            message: translateError('Token expired'),
            status: 401
        });
    }

    return res.status(500).json({
        message: translateError('Unexpected error occurred'),
        status: 500
    });
};