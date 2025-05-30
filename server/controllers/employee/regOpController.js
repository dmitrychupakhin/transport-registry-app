const { RegistrationOp } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');
const { regOpPatchSchema } = require('../../validations/regOpShema');

class RegOpController {
    async getAllRegOp(req, res, next) {
        try {
            const { error } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(20),
                page: Joi.number().integer().min(1).default(1),
                vin: Joi.string().pattern(/^[A-HJ-NPR-Z0-9]{17}$/).optional(),
                registrationNumber: Joi.string().pattern(/^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$/).optional(),
                unitCode: Joi.string().length(6).optional(),
                operationType: Joi.string().valid('Постановка на учет', 'Снятие с учета', 'Внесение измененеий в регистрационные данные').optional(),
                startDate: Joi.date().iso().optional(),
                endDate: Joi.date().iso().optional()
            }).validate(req.query);

            if (error) {
                throw ApiError.badRequest(error.details[0].message);
            }

            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const offset = (page - 1) * limit;

            const where = {};
            if (req.query.vin) where.vin = req.query.vin;
            if (req.query.registrationNumber) where.registrationNumber = req.query.registrationNumber;
            if (req.query.unitCode) where.unitCode = req.query.unitCode;
            if (req.query.operationType) where.operationType = req.query.operationType;
          
            if (req.query.startDate && req.query.endDate) {
                where.operationDate = { 
                    [Op.between]: [
                        new Date(req.query.startDate + 'T00:00:00.000Z'),
                        new Date(req.query.endDate + 'T23:59:59.999Z')
                    ] 
                };
            } else if (req.query.startDate) {
                where.operationDate = { [Op.gte]: new Date(req.query.startDate + 'T00:00:00.000Z') };
            } else if (req.query.endDate) {
                where.operationDate = { [Op.lte]: new Date(req.query.endDate + 'T23:59:59.999Z') };
            }

            const { count, rows } = await RegistrationOp.findAndCountAll({
                where,
                limit,
                offset,
                order: [['operationDate', 'DESC']],
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            });

            res.json({
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: page,
                data: rows
            });
        } catch (e) {
            if (e instanceof ApiError) {
                next(e);
            } else {
                console.error('Ошибка при получении списка операций:', e);
                next(ApiError.internal('Произошла ошибка при получении списка операций'));
            }
        }
    }

    async getRegOpByVin(req, res, next) {
        try {
            const { error: vinError } = Joi.string()
                .pattern(/^[A-HJ-NPR-Z0-9]{17}$/)
                .required()
                .validate(req.params.vin);

            if (vinError) {
                throw ApiError.badRequest('Неверный формат VIN');
            }

            const { error: queryError } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(20),
                page: Joi.number().integer().min(1).default(1)
            }).validate(req.query);

            if (queryError) {
                throw ApiError.badRequest(queryError.details[0].message);
            }

            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const offset = (page - 1) * limit;

            const { count, rows } = await RegistrationOp.findAndCountAll({
                where: { vin: req.params.vin },
                limit,
                offset,
                order: [['operationDate', 'DESC']],
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            });

            if (!count) {
                throw ApiError.notFound('Операции для указанного VIN не найдены');
            }

            res.json({
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: page,
                data: rows
            });
        } catch (e) {
            if (e instanceof ApiError) {
                next(e);
            } else {
                console.error('Ошибка при получении операций по VIN:', e);
                next(ApiError.internal('Произошла ошибка при получении операций'));
            }
        }
    }

    async patchRegOp(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;

            const { error: idError } = Joi.number()
                .integer()
                .positive()
                .required()
                .validate(id);

            if (idError) {
                throw ApiError.badRequest('Неверный формат ID операции');
            }

            const { error: bodyError } = regOpPatchSchema.validate(req.body);
            if (bodyError) {
                throw ApiError.badRequest(bodyError.details[0].message);
            }

            const operation = await RegistrationOp.findByPk(id, { transaction });
            if (!operation) {
                throw ApiError.notFound('Операция не найдена');
            }

            const updateData = {};
            if (req.body.registrationNumber !== undefined) {
                updateData.registrationNumber = req.body.registrationNumber;
            }
            if (req.body.operationDate) {
                updateData.operationDate = req.body.operationDate;
            }

            await operation.update(updateData, { transaction });
            await transaction.commit();

            const updatedOperation = await RegistrationOp.findByPk(id, {
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            });

            res.json(updatedOperation);
        } catch (e) {
            await transaction.rollback();
            if (e instanceof ApiError) {
                next(e);
            } else {
                console.error('Ошибка при обновлении операции:', e);
                next(ApiError.internal('Произошла ошибка при обновлении операции'));
            }
        }
    }
}

module.exports = new RegOpController();