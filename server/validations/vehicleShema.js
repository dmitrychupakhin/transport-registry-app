const Joi = require('joi');

const vehicleCreateSchema = Joi.object({
    vin: Joi.string().pattern(/^[A-HJ-NPR-Z0-9]{17}$/).required()
        .messages({
            'string.pattern.base': 'VIN должен состоять из 17 символов (латинские буквы, кроме I, O, Q, и цифры)'
        }),
    makeAndModel: Joi.string().min(2).max(100).required(),
    releaseYear: Joi.string().pattern(/^(19|20)\d{2}$/).required()
        .messages({
            'string.pattern.base': 'Год выпуска должен быть в формате YYYY (1900-2099)'
        }),
    manufacture: Joi.string().min(2).max(100).required(),
    typeOfDrive: Joi.string().valid('FWD', 'RWD', 'AWD', '4WD').required(),
    power: Joi.string().pattern(/^\d+\s*кВт\/\d+\s*л\.с\.$/).required()
        .messages({
            'string.pattern.base': 'Мощность должна быть указана в формате "число кВт/число л.с."'
        }),
    hasChassisNumber: Joi.boolean().default(false),
    bodyColor: Joi.string().min(2).max(50).required(),
    transmissionType: Joi.string().valid('MT', 'AT', 'AMT', 'CVT', 'DCT').required(),
    steeringWheel: Joi.string().valid('Правостороннее', 'Левостороннее').required(),
    engineModel: Joi.string().pattern(/^[A-Z0-9-]+$/).required()
        .messages({
            'string.pattern.base': 'Модель двигателя должна содержать только латинские буквы, цифры и дефис'
        }),
    engineVolume: Joi.number().integer().min(500).max(7400).required()
        .messages({
            'number.min': 'Объем двигателя должен быть не менее 500 см³',
            'number.max': 'Объем двигателя должен быть не более 7400 см³'
        })
});

const vehicleUpdateSchema = Joi.object({
    makeAndModel: Joi.string().min(2).max(100).required(),
    releaseYear: Joi.string().pattern(/^(19|20)\d{2}$/).required()
        .messages({
            'string.pattern.base': 'Год выпуска должен быть в формате YYYY (1900-2099)'
        }),
    manufacture: Joi.string().min(2).max(100).required(),
    typeOfDrive: Joi.string().valid('FWD', 'RWD', 'AWD', '4WD').required(),
    power: Joi.string().pattern(/^\d+\s*кВт\/\d+\s*л\.с\.$/).required()
        .messages({
            'string.pattern.base': 'Мощность должна быть указана в формате "число кВт/число л.с."'
        }),
    hasChassisNumber: Joi.boolean(),
    bodyColor: Joi.string().min(2).max(50).required(),
    transmissionType: Joi.string().valid('MT', 'AT', 'AMT', 'CVT', 'DCT').required(),
    steeringWheel: Joi.string().valid('Правостороннее', 'Левостороннее').required(),
    engineModel: Joi.string().pattern(/^[A-Z0-9-]+$/).required()
        .messages({
            'string.pattern.base': 'Модель двигателя должна содержать только латинские буквы, цифры и дефис'
        }),
    engineVolume: Joi.number().integer().min(500).max(7400).required()
        .messages({
            'number.min': 'Объем двигателя должен быть не менее 500 см³',
            'number.max': 'Объем двигателя должен быть не более 7400 см³'
        })
});

const vehiclePatchSchema = Joi.object({
    makeAndModel: Joi.string().min(2).max(100),
    releaseYear: Joi.string().pattern(/^(19|20)\d{2}$/)
        .messages({
            'string.pattern.base': 'Год выпуска должен быть в формате YYYY (1900-2099)'
        }),
    manufacture: Joi.string().min(2).max(100),
    typeOfDrive: Joi.string().valid('FWD', 'RWD', 'AWD', '4WD'),
    power: Joi.string().pattern(/^\d+\s*кВт\/\d+\s*л\.с\.$/)
        .messages({
            'string.pattern.base': 'Мощность должна быть указана в формате "число кВт/число л.с."'
        }),
    hasChassisNumber: Joi.boolean(),
    bodyColor: Joi.string().min(2).max(50),
    transmissionType: Joi.string().valid('MT', 'AT', 'AMT', 'CVT', 'DCT'),
    steeringWheel: Joi.string().valid('Правостороннее', 'Левостороннее'),
    engineModel: Joi.string().pattern(/^[A-Z0-9-]+$/)
        .messages({
            'string.pattern.base': 'Модель двигателя должна содержать только латинские буквы, цифры и дефис'
        }),
    engineVolume: Joi.number().integer().min(500).max(7400)
        .messages({
            'number.min': 'Объем двигателя должен быть не менее 500 см³',
            'number.max': 'Объем двигателя должен быть не более 7400 см³'
        })
}).min(1);

module.exports = {
    vehicleCreateSchema,
    vehicleUpdateSchema,
    vehiclePatchSchema
};