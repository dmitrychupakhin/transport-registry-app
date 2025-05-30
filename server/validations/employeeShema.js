const Joi = require('joi');

const employeeSchema = Joi.object({
    badgeNumber: Joi.string().pattern(/^\d{2}-\d{4}$/).required(),
    unitCode: Joi.string().length(6).required(),
    lastName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    firstName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    patronymic: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    rank: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required()
});

const employeePutSchema = Joi.object({
    unitCode: Joi.string().length(6).required(),
    lastName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    firstName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    patronymic: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    rank: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required()
});

const employeePatchSchema = Joi.object({
    unitCode: Joi.string().length(6),
    lastName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50),
    firstName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50),
    patronymic: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50),
    rank: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50)
}).min(1);

module.exports = {
    employeeSchema,
    employeePutSchema,
    employeePatchSchema
};