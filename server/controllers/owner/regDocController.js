const { RegistrationDoc, TransportVehicle, RegistrationOp, RegDepartment } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');

const registrationRequestSchema = Joi.object({
    vin: Joi.string().pattern(/^[A-Z0-9]{17}$/).required(),
    departmentId: Joi.number().integer().min(1).required(),
    operationType: Joi.string().valid('registration', 'change', 'deregistration').required(),
    purpose: Joi.string().min(5).max(255).required()
});

class RegDocController {
    /**
     * Get all user's registration documents
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getAllRegDoc(req, res, next) {
        try {
            const { error } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(10),
                page: Joi.number().integer().min(1).default(1)
            }).validate(req.query);

            if (error) throw ApiError.badRequest(error.details[0].message);

            const { limit, page } = req.query;
            const offset = (page - 1) * limit;
            const userId = req.user.id;

            const { count, rows } = await RegistrationDoc.findAndCountAll({
                where: {
                    [Op.or]: [
                        { ownerPassport: userId },
                        { ownerTaxNumber: userId }
                    ]
                },
                limit,
                offset,
                include: [
                    {
                        model: TransportVehicle,
                        attributes: ['vin', 'makeAndModel', 'releaseYear']
                    }
                ],
                order: [['registrationDate', 'DESC']]
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
     * Create registration document request
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async createRegDoc(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { error } = Joi.object({
                vin: Joi.string().pattern(/^[A-Z0-9]{17}$/).required(),
                departmentId: Joi.number().integer().min(1).required(),
                operationType: Joi.string().valid('registration', 'change', 'deregistration').required()
            }).validate(req.body);

            if (error) throw ApiError.badRequest(error.details[0].message);

            const { vin, departmentId, operationType } = req.body;
            const userId = req.user.id;

            // Проверка существования ТС
            const vehicle = await TransportVehicle.findOne({
                where: { vin },
                transaction
            });

            if (!vehicle) {
                throw ApiError.badRequest('Vehicle not found');
            }

            // Создание заявки на регистрационную операцию
            const request = await RegistrationOp.create({
                vin,
                departmentId,
                operationType,
                requestedBy: userId,
                status: 'pending'
            }, { transaction });

            await transaction.commit();
            res.status(201).json(request);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }

    /**
     * Get registration request status
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getRequestStatus(req, res, next) {
        try {
            const { requestId } = req.params;
            const userId = req.user.id;

            const request = await RegistrationOp.findOne({
                where: {
                    id: requestId,
                    requestedBy: userId
                },
                include: [
                    {
                        model: RegDepartment,
                        attributes: ['name', 'address']
                    }
                ]
            });

            if (!request) {
                throw ApiError.notFound('Request not found');
            }

            res.json(request);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new RegDocController();