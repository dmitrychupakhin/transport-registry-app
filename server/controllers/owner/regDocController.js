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
    async getRegDocByRegNumber(req, res, next) {
        
    }
}

module.exports = new RegDocController();