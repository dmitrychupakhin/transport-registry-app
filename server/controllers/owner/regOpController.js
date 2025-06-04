const { RegistrationOp, TransportVehicle, RegistrationDoc } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const { Op } = require('sequelize');
const Joi = require('joi');
const sequelize = require('../../db');
const { regOpSchema } = require('../../validations/regOpShema');

class RegOpController {
    async getAllRegOp(req, res, next) {
        try {
            const { error } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(10),
                page: Joi.number().integer().min(1).default(1)
            }).validate(req.query);

            if (error) throw ApiError.badRequest(error.details[0].message);
            const { limit, page } = req.query;
            const offset = (page - 1) * limit;

            const user = req.user;
            if (user.role !== 'OWNER') throw ApiError.forbidden('Only owners can view registration operations');

            const documentOwner = user.passportData || user.taxNumber;
            if (!documentOwner) throw ApiError.forbidden('Unable to determine the document owner');

            const docs = await RegistrationDoc.findAll({
                where: { documentOwner },
                attributes: ['registrationNumber']
            });

            const regNumbers = docs.map(doc => doc.registrationNumber).filter(Boolean);
            if (!regNumbers.length) return res.json({ data: [], total: 0  });

            const { count, rows } = await RegistrationOp.findAndCountAll({
                where: {
                    registrationNumber: { [Op.in]: regNumbers }
                },
                include: [
                    {
                        model: TransportVehicle,
                        attributes: ['vin', 'makeAndModel', 'releaseYear']
                    },
                    {
                        model: RegistrationDoc,
                        attributes: ['registrationNumber', 'registrationDate']
                    }
                ],
                limit,
                offset,
                order: [['operationDate', 'DESC']]
            });

            res.json({
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: page,
                data: rows
            });
        } catch (e) {
            console.error("GET ALL REGOP ERROR:", e);
            next(ApiError.internal(e.message));
        }
    }

    async getRegOpByVin(req, res, next) {
        try {
            const { error } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(10),
                page: Joi.number().integer().min(1).default(1)
            }).validate(req.query);

            if (error) throw ApiError.badRequest(error.details[0].message);
            
            const { vin } = req.params;
            const { limit, page } = req.query;
            const offset = (page - 1) * limit;

            const user = req.user;
            if (user.role !== 'OWNER') throw ApiError.forbidden('Only owners can view registration operations');

            const documentOwner = user.passportData || user.taxNumber;
            if (!documentOwner) throw ApiError.forbidden('Unable to determine the document owner');

            const opsByVin = await RegistrationOp.findAll({
                where: { vin },
                attributes: ['registrationNumber']
            });

            const regNumbers = opsByVin.map(op => op.registrationNumber);
            if (!regNumbers.length) {
                return res.json({
                    total: 0,
                    pages: 0,
                    currentPage: Number(page),
                    data: []
                });
            }

            const docs = await RegistrationDoc.findAll({
                where: {
                    registrationNumber: { [Op.in]: regNumbers },
                    documentOwner
                },
                attributes: ['registrationNumber']
            });

            const ownedRegNumbers = docs.map(d => d.registrationNumber);
            if (!ownedRegNumbers.length) {
                return res.json({
                    total: 0,
                    pages: 0,
                    currentPage: Number(page),
                    data: []
                });
            }

            const { count, rows } = await RegistrationOp.findAndCountAll({
                where: {
                    vin,
                    registrationNumber: { [Op.in]: ownedRegNumbers }
                },
                include: [
                    {
                        model: TransportVehicle,
                        attributes: ['vin', 'makeAndModel', 'releaseYear']
                    },
                    {
                        model: RegistrationDoc,
                        attributes: ['registrationNumber', 'registrationDate']
                    }
                ],
                limit,
                offset,
                order: [['operationDate', 'DESC']]
            });

            res.json({
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: page,
                data: rows
            });
        } catch (e) {
            console.error('GET REG-OP BY VIN ERROR:', e);
            next(ApiError.internal(e.message));
        }
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
                throw ApiError.badRequest('Vehicle with the specified VIN was not found');
            }

            if (req.body.registrationNumber) {
                const doc = await RegistrationDoc.findOne({
                    where: { registrationNumber: req.body.registrationNumber },
                    transaction
                });

                if (!doc) {
                    throw ApiError.badRequest('Registration document was not found');
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
                message: 'Registration operation successfully created',
                data: createdOperation
            });
        } catch (e) {
            await transaction.rollback();
            
            if (e instanceof ApiError) {
                next(e);
            } else {
                console.error('CREATE REGOP ERROR:', e);
                next(ApiError.internal(e.message));
            }
        }
    }
}

module.exports = new RegOpController();