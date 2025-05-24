const { RegistrationOp, Employee, TransportVehicle, RegistrationDoc } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');

const regOpSchema = Joi.object({
    vin: Joi.string().pattern(/^[A-Z0-9]{17}$/).required(),
    registrationNumber: Joi.string().pattern(/^[A-Z0-9]{8,20}$/).optional(),
    unitCode: Joi.string().min(3).max(50).required(),
    operationType: Joi.string().valid('registration', 'deregistration', 'change').required(),
    operationBase: Joi.string().min(5).max(255).required(),
    operationDate: Joi.date().iso().required(),
    badgeNumber: Joi.string().pattern(/^[A-Z0-9]{5,10}$/).required()
});

class RegOpController {
    /**
     * Get all registration operations with filtering
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getAllRegOp(req, res, next) {
        try {
            const { error } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(20),
                page: Joi.number().integer().min(1).default(1),
                vin: Joi.string().pattern(/^[A-Z0-9]{17}$/).optional(),
                operationType: Joi.string().valid('registration', 'deregistration', 'change').optional(),
                startDate: Joi.date().iso().optional(),
                endDate: Joi.date().iso().optional(),
                badgeNumber: Joi.string().pattern(/^[A-Z0-9]{5,10}$/).optional()
            }).validate(req.query);

            if (error) throw ApiError.badRequest(error.details[0].message);

            const { limit, page, vin, operationType, startDate, endDate, badgeNumber } = req.query;
            const offset = (page - 1) * limit;

            const where = {};
            if (vin) where.vin = vin;
            if (operationType) where.operationType = operationType;
            if (badgeNumber) where.badgeNumber = badgeNumber;
            if (startDate && endDate) {
                where.operationDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
            }

            const { count, rows } = await RegistrationOp.findAndCountAll({
                where,
                limit,
                offset,
                include: [
                    {
                        model: Employee,
                        attributes: ['badgeNumber', 'firstName', 'lastName']
                    },
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
                order: [['operationDate', 'DESC']],
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            });

            res.json({
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: +page,
                data: rows
            });
        } catch (e) {
            next(ApiError.internal(e.message));
        }
    }

    /**
     * Get registration operation by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getRegOpById(req, res, next) {
        try {
            const { id } = req.params;

            if (!Number.isInteger(+id)) {
                throw ApiError.badRequest('Invalid operation ID');
            }

            const operation = await RegistrationOp.findByPk(id, {
                include: [
                    {
                        model: Employee,
                        attributes: ['badgeNumber', 'firstName', 'lastName']
                    },
                    {
                        model: TransportVehicle,
                        attributes: ['vin', 'makeAndModel', 'releaseYear', 'bodyColor'],
                        required: false
                    },
                    {
                        model: RegistrationDoc,
                        attributes: ['registrationNumber', 'registrationDate', 'address'],
                        required: false
                    }
                ]
            });

            if (!operation) {
                throw ApiError.notFound('Operation not found');
            }

            res.json(operation);
        } catch (e) {
            next(e);
        }
    }

    /**
     * Update registration operation
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async updateRegOp(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;
            const { error } = regOpSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const operation = await RegistrationOp.findByPk(id, { transaction });
            if (!operation) {
                throw ApiError.notFound('Operation not found');
            }

            // Проверка существования сотрудника
            const employee = await Employee.findOne({
                where: { badgeNumber: req.body.badgeNumber },
                transaction
            });

            if (!employee) {
                throw ApiError.badRequest('Employee not found');
            }

            // Проверка существования ТС
            const vehicle = await TransportVehicle.findOne({
                where: { vin: req.body.vin },
                transaction
            });

            if (!vehicle) {
                throw ApiError.badRequest('Vehicle not found');
            }

            // Проверка существования регистрационного документа если указан
            if (req.body.registrationNumber) {
                const doc = await RegistrationDoc.findOne({
                    where: { registrationNumber: req.body.registrationNumber },
                    transaction
                });

                if (!doc) {
                    throw ApiError.badRequest('Registration document not found');
                }
            }

            await operation.update(req.body, {
                transaction,
                fields: ['vin', 'registrationNumber', 'unitCode', 'operationType', 'operationBase', 'operationDate', 'badgeNumber']
            });

            await transaction.commit();
            res.json(operation);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }
}

module.exports = new RegOpController();