const Joi = require('joi');

const regDepartSchema = Joi.object({
    unitCode: Joi.string().length(6).required(),
    departmentName: Joi.string().min(8).max(128).required(),
    address: Joi.string().min(8).max(255).required()    
});

const regDepartPutSchema = Joi.object({
    departmentName: Joi.string().min(8).max(128).required(),
    address: Joi.string().min(8).max(255).required()    
});

const regDepartPatchSchema = Joi.object({
    departmentName: Joi.string().min(8).max(128),
    address: Joi.string().min(8).max(255)
}).min(1);

module.exports = {
    regDepartSchema,
    regDepartPutSchema,
    regDepartPatchSchema   
};