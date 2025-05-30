const Joi = require('joi');

const regOpSchema = Joi.object({
    vin: Joi.string()
        .pattern(/^[A-HJ-NPR-Z0-9]{17}$/)
        .required()
        .messages({
            'string.pattern.base': 'VIN должен состоять из 17 символов (буквы A-H, J-N, P-Z и цифры)',
            'any.required': 'VIN обязателен'
        }),
    registrationNumber: Joi.string()
        .pattern(/^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$/)
        .allow('')
        .optional()
        .messages({
            'string.pattern.base': 'Неверный формат регистрационного номера'
        }),
    unitCode: Joi.string()
        .length(6)
        .required()
        .messages({
            'string.length': 'Код подразделения должен состоять из 6 символов',
            'any.required': 'Код подразделения обязателен'
        }),
    operationType: Joi.string()
        .valid('Постановка на учет', 'Снятие с учета', 'Внесение измененеий в регистрационные данные')
        .required()
        .messages({
            'any.only': 'Неверный тип операции',
            'any.required': 'Тип операции обязателен'
        }),
    operationBase: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.max': 'Основание операции не должно превышать 255 символов',
            'any.required': 'Основание операции обязательно'
        }),
    operationDate: Joi.date()
        .iso()
        .required()
        .messages({
            'date.base': 'Неверный формат даты',
            'date.format': 'Дата должна быть в формате ISO',
            'any.required': 'Дата операции обязательна'
        })
});

const regOpPatchSchema = Joi.object({
    registrationNumber: Joi.string()
        .pattern(/^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$/)
        .allow('')
        .optional()
        .messages({
            'string.pattern.base': 'Неверный формат регистрационного номера'
        }),
    operationDate: Joi.date()
        .iso()
        .optional()
        .messages({
            'date.base': 'Неверный формат даты',
            'date.format': 'Дата должна быть в формате ISO'
        })
}).min(1).messages({
    'object.min': 'Необходимо указать хотя бы одно поле для обновления (registrationNumber или operationDate)'
});

module.exports = {
    regOpSchema,
    regOpPatchSchema
};