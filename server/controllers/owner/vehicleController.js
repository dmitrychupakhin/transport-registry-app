const { TransportVehicle, RegistrationDoc } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');

class VehicleController {
    /**
     * Get user's vehicles
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getMyVehicles(req, res, next) {
        try {
            const { error } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(20),
                page: Joi.number().integer().min(1).default(1)
            }).validate(req.query);

            if (error) throw ApiError.badRequest(error.details[0].message);

            const { limit, page } = req.query;
            const offset = (page - 1) * limit;
            const userId = req.user.id;

            const { count, rows } = await TransportVehicle.findAndCountAll({
                include: [{
                    model: RegistrationDoc,
                    where: {
                        [Op.or]: [
                            { ownerPassport: userId },
                            { ownerTaxNumber: userId }
                        ]
                    },
                    required: true,
                    attributes: ['registrationNumber', 'registrationDate']
                }],
                limit,
                offset,
                order: [['makeAndModel', 'ASC']]
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
     * Create new vehicle
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async createVehicle(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { error } = Joi.object({
                vin: Joi.string().pattern(/^[A-Z0-9]{17}$/).required(),
                makeAndModel: Joi.string().min(2).max(100).required(),
                releaseYear: Joi.string().pattern(/^(19|20)\d{2}$/).required(),
                manufacture: Joi.string().min(2).max(100).required(),
                typeOfDrive: Joi.string().valid('FWD', 'RWD', 'AWD', '4WD').required(),
                power: Joi.string().pattern(/^\d+\s*(hp|kW)$/).required(),
                chassisNumber: Joi.string().min(5).max(50).required(),
                bodyNumber: Joi.string().min(5).max(50).required(),
                bodyColor: Joi.string().min(2).max(50).required(),
                transmissionType: Joi.string().valid('manual', 'automatic', 'CVT', 'semi-automatic').required(),
                steeringWheel: Joi.string().valid('left', 'right').required(),
                engineModel: Joi.string().min(2).max(50).required(),
                engineVolume: Joi.number().integer().min(500).max(10000).required()
            }).validate(req.body);

            if (error) throw ApiError.badRequest(error.details[0].message);

            const { vin } = req.body;

            const existingVehicle = await TransportVehicle.findOne({
                where: { vin },
                transaction
            });

            if (existingVehicle) {
                throw ApiError.conflict('Vehicle with this VIN already exists');
            }

            const vehicle = await TransportVehicle.create(req.body, {
                transaction
            });

            await transaction.commit();
            res.status(201).json(vehicle);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }

    /**
     * Get vehicle by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getMyVehicleById(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const vehicle = await TransportVehicle.findOne({
                where: { vin: id },
                include: [{
                    model: RegistrationDoc,
                    where: {
                        [Op.or]: [
                            { ownerPassport: userId },
                            { ownerTaxNumber: userId }
                        ]
                    },
                    required: true,
                    attributes: ['registrationNumber', 'registrationDate']
                }]
            });

            if (!vehicle) {
                throw ApiError.notFound('Vehicle not found');
            }

            res.json(vehicle);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new VehicleController();