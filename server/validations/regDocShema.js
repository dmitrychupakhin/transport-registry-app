const Joi = require('joi');

const regDocSchema = Joi.object({
    registrationNumber: Joi.string().pattern(/^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$/).required()
        .messages({ 'string.pattern.base': 'Registration number must match format: А123АА77 (1 letter + 3 digits + 2 letters + 2-3 digits)' }),
    address: Joi.string().min(8).max(255).required(),
    pts: Joi.string().pattern(/^\d{2} [А-Я]{2} \d{6}$/).required()
        .messages({ 'string.pattern.base': 'PTS must match format: 12 АБ 345678 (2 digits + space + 2 uppercase Russian letters + space + 6 digits)' }),
    sts: Joi.string().pattern(/^\d{2} \d{2} \d{6}$/).required()
        .messages({ 'string.pattern.base': 'STS must match format: 12 34 567890 (2 digits + space + 2 digits + space + 6 digits)' }),
    registrationDate: Joi.date().iso().required(),
    documentOwner: Joi.string().required()
        .custom((value, helpers) => {
            if (value.length === 11) {
                if (!/^\d{4} \d{6}$/.test(value)) {
                    return helpers.error('any.invalid', { message: 'Invalid passport format (should be "1234 567890")' });
                }
            } else if (value.length === 10) {
                if (!/^\d{10}$/.test(value)) {
                    return helpers.error('any.invalid', { message: 'Invalid tax number format (should be 10 digits)' });
                }
            } else {
                return helpers.error('any.invalid', { message: 'documentOwner must be either passport (11 chars) or tax number (10 chars)' });
            }
            return value;
        })
});

const regDocPutSchema = Joi.object({
    address: Joi.string().min(8).max(255).required(),
    pts: Joi.string().pattern(/^\d{2} [А-Я]{2} \d{6}$/).required()
        .messages({ 'string.pattern.base': 'PTS must match format: 12 АБ 345678 (2 digits + space + 2 uppercase Russian letters + space + 6 digits)' }),
    sts: Joi.string().pattern(/^\d{2} \d{2} \d{6}$/).required()
        .messages({ 'string.pattern.base': 'STS must match format: 12 34 567890 (2 digits + space + 2 digits + space + 6 digits)' }),
    registrationDate: Joi.date().iso().required(),
    documentOwner: Joi.string().required()
        .custom((value, helpers) => {
            if (value.length === 11) {
                if (!/^\d{4} \d{6}$/.test(value)) {
                    return helpers.error('any.invalid', { message: 'Invalid passport format (should be "1234 567890")' });
                }
            } else if (value.length === 10) {
                if (!/^\d{10}$/.test(value)) {
                    return helpers.error('any.invalid', { message: 'Invalid tax number format (should be 10 digits)' });
                }
            } else {
                return helpers.error('any.invalid', { message: 'documentOwner must be either passport (11 chars) or tax number (10 chars)' });
            }
            return value;
        })
});

const regDocPatchSchema = Joi.object({
    address: Joi.string().min(8).max(255),
    pts: Joi.string().pattern(/^\d{2} [А-Я]{2} \d{6}$/)
        .messages({ 'string.pattern.base': 'PTS must match format: 12 АБ 345678 (2 digits + space + 2 uppercase Russian letters + space + 6 digits)' }),
    sts: Joi.string().pattern(/^\d{2} \d{2} \d{6}$/)
        .messages({ 'string.pattern.base': 'STS must match format: 12 34 567890 (2 digits + space + 2 digits + space + 6 digits)' }),
    registrationDate: Joi.date().iso(),
    documentOwner: Joi.string()
        .custom((value, helpers) => {
            if (value.length === 11) {
                if (!/^\d{4} \d{6}$/.test(value)) {
                    return helpers.error('any.invalid', { message: 'Invalid passport format (should be "1234 567890")' });
                }
            } else if (value.length === 10) {
                if (!/^\d{10}$/.test(value)) {
                    return helpers.error('any.invalid', { message: 'Invalid tax number format (should be 10 digits)' });
                }
            } else {
                return helpers.error('any.invalid', { message: 'documentOwner must be either passport (11 chars) or tax number (10 chars)' });
            }
            return value;
        })
}).min(1);

module.exports = {
    regDocSchema,
    regDocPutSchema,
    regDocPatchSchema
};