const Joi = require('joi');

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
    naturalPersonPutSchema,
    naturalPersonPatchSchema,
    legalEntityPutSchema,
    legalEntityPatchSchema
};