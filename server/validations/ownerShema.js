const Joi = require('joi');

const naturalPersonSchema = Joi.object({
    isNaturalPerson: Joi.boolean().required(),
    passportData: Joi.string().pattern(/^\d{4} \d{6}$/).required()
        .messages({ 'string.pattern.base': 'passportData must match format "1234 567890"' }),
    address: Joi.string().min(8).max(255).required(),
    lastName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    firstName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    patronymic: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required()
});

const legalEntitySchema = Joi.object({
    isNaturalPerson: Joi.boolean().required(),
    taxNumber: Joi.string().pattern(/^\d{10}$/).required()
        .messages({ 'string.pattern.base': 'taxNumber must contain exactly 10 digits' }),
    address: Joi.string().min(8).max(255).required(),
    companyName: Joi.string().min(3).max(100).required()
});

const naturalPersonPutSchema = Joi.object({    
    address: Joi.string().min(8).max(255).required(),
    lastName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    firstName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    patronymic: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required()
});

const naturalPersonPatchSchema = Joi.object({
    address: Joi.string().min(8).max(255),
    lastName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50),
    firstName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50),
    patronymic: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50)
}).min(1);

const legalEntityPutSchema = Joi.object({
    address: Joi.string().min(8).max(255).required(),
    companyName: Joi.string().min(3).max(100).required()
});

const legalEntityPatchSchema = Joi.object({
    address: Joi.string().min(8).max(255),
    companyName: Joi.string().min(3).max(100)
}).min(1);

module.exports = {
    naturalPersonSchema,
    legalEntitySchema,
    naturalPersonPutSchema,
    naturalPersonPatchSchema,
    legalEntityPutSchema,
    legalEntityPatchSchema
};