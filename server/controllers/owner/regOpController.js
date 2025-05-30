const { RegistrationOp, TransportVehicle, RegistrationDoc } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');
const { regOpSchema } = require('../../validations/regOpShema');

class RegOpController {
    async getAllRegOp(req, res, next) {

    }

    async getRegOpByVin(req, res, next) {

    }

    async createRegOp(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { error } = regOpSchema.validate(req.body, {
                abortEarly: false,
                allowUnknown: false
            });

            if (error) {
                const errorMessages = error.details.map(detail => detail.message);
                throw ApiError.badRequest(errorMessages.join(', '));
            }

            const vehicle = await TransportVehicle.findOne({
                where: { vin: req.body.vin },
                transaction
            });

            if (!vehicle) {
                throw ApiError.badRequest('Транспортное средство с указанным VIN не найдено');
            }

            if (req.body.registrationNumber) {
                const doc = await RegistrationDoc.findOne({
                    where: { registrationNumber: req.body.registrationNumber },
                    transaction
                });

                if (!doc) {
                    throw ApiError.badRequest('Регистрационный документ не найден');
                }
            }

            const operation = await RegistrationOp.create({
                vin: req.body.vin,
                registrationNumber: req.body.registrationNumber || null,
                unitCode: req.body.unitCode,
                operationType: req.body.operationType,
                operationBase: req.body.operationBase,
                operationDate: req.body.operationDate
            }, { transaction });

            await transaction.commit();

            const createdOperation = await RegistrationOp.findByPk(operation.operationId, {
                include: [
                    {
                        model: TransportVehicle,
                        attributes: ['vin', 'makeAndModel', 'releaseYear'],
                        required: false
                    },
                    {
                        model: RegistrationDoc,
                        attributes: ['registrationNumber', 'registrationDate'],
                        required: false
                    }
                ],
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            });

            res.status(201).json({
                message: 'Операция регистрации успешно создана',
                data: createdOperation
            });
        } catch (e) {
            await transaction.rollback();
            
            if (e instanceof ApiError) {
                next(e);
            } else {
                console.error('Ошибка при создании операции регистрации:', e);
                next(ApiError.internal('Произошла ошибка при создании операции регистрации'));
            }
        }
    }
}

module.exports = new RegOpController();