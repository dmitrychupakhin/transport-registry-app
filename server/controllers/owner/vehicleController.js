const { RegistrationDoc, RegistrationOp, TransportVehicle } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const sequelize = require('../../db');
const { Op } = require('sequelize');
const Joi = require('joi');
const { vehicleCreateSchema } = require('../../validations/vehicleShema');

class VehicleController {
    async getMyVehicles(req, res, next) {
        try {
            const { error } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(10),
                page: Joi.number().integer().min(1).default(1)
            }).validate(req.query);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const { limit, page } = req.query;
            const offset = (page - 1) * limit;

            const user = req.user;
            if (user.role !== 'OWNER') throw ApiError.forbidden('Only owners can access their vehicles');

            const documentOwner = user.passportData || user.taxNumber;
            if (!documentOwner) throw ApiError.forbidden('Unable to determine document owner');

            const docs = await RegistrationDoc.findAll({
                where: { documentOwner },
                attributes: ['registrationNumber']
            });

            const regNumbers = docs.map(doc => doc.registrationNumber);
            if (!regNumbers.length) return res.json({ total: 0, pages: 0, currentPage: +page, data: [] });

            const regOps = await RegistrationOp.findAll({
                where: { registrationNumber: { [Op.in]: regNumbers } },
                attributes: ['vin']
            });

            const vins = [...new Set(regOps.map(op => op.vin))]; 
            if (!vins.length) return res.json({ total: 0, pages: 0, currentPage: +page, data: [] });

            const { count, rows } = await TransportVehicle.findAndCountAll({
                where: { vin: vins },
                limit,
                offset,
                order: [['vin', 'ASC']]
            });

            res.json({
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: page,
                data: rows
            });
        } catch (e) {
            console.error('GET MY VEHICLES ERROR:', e);
            next(ApiError.internal(e.message));
        }
    }

    async getMyVehicleByVin(req, res, next) {
        try {
            const { vin } = req.params;
            const user = req.user;

            if (user.role !== 'OWNER') throw ApiError.forbidden('Only owners can access their vehicles');
            
            const documentOwner = user.passportData || user.taxNumber;
            if (!documentOwner) throw ApiError.forbidden('Unable to determine the document owner');

            const docs = await RegistrationDoc.findAll({
                where: { documentOwner },
                attributes: ['registrationNumber']
            });

            const regNumbers = docs.map(doc => doc.registrationNumber);

            if (!regNumbers.length) {
                throw ApiError.notFound('Vehicle not found or no access');
            }

            const regOp = await RegistrationOp.findOne({
                where: {
                    vin,
                    registrationNumber: regNumbers
                }
            });

            if (!regOp) {
                throw ApiError.notFound('Vehicle not found or does not belong to you');
            }

            const vehicle = await TransportVehicle.findByPk(vin, {
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            });

            if (!vehicle) throw ApiError.notFound('Vehicle not found');

            res.json(vehicle);
        } catch (e) {
            console.error("GET VEHICLE BY VIN ERROR:", e);
            next(ApiError.internal(e.message));
        }
    }

    async createVehicle(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { error } = vehicleCreateSchema.validate(req.body, {
                abortEarly: false,
                allowUnknown: false
            });

            if (error) {
                const errorMessages = error.details.map(detail => detail.message);
                throw ApiError.badRequest(errorMessages.join(', '));
            }

            const { vin } = req.body;

            const existingVehicle = await TransportVehicle.findOne({
                where: { vin },
                transaction
            });

            if (existingVehicle) {
                throw ApiError.conflict('A vehicle with this VIN is already registered');
            }

            const vehicleData = {
                ...req.body,
                bodyNumber: vin.slice(-6), 
                chassisNumber: req.body.hasChassisNumber ? vin : null 
            };

            const vehicle = await TransportVehicle.create(vehicleData, {
                transaction
            });

            await transaction.commit();

            const createdVehicle = await TransportVehicle.findByPk(vehicle.vin, {
                attributes: { 
                    exclude: ['createdAt', 'updatedAt']
                }
            });

            return res.status(201).json({
                message: 'The vehicle has been successfully added to the database',
                data: createdVehicle
            });
        } catch (e) {
            await transaction.rollback();
            
            if (e instanceof ApiError) {
                next(e);
            } else {
                console.error('CREATE VEHICLE ERROR:', e);
                next(ApiError.internal(e.message));
            }
        }
    }
}

module.exports = new VehicleController();