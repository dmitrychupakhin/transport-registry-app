const { TransportVehicle } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');
const { vehicleCreateSchema } = require('../../validations/vehicleShema');

class VehicleController {
    async getMyVehicles(req, res, next) {
        
    }

    async getMyVehicleByVin(req, res, next) {
        
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
                throw ApiError.conflict('Транспортное средство с таким VIN уже зарегистрировано');
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
                message: 'Транспортное средство успешно добавлено в базу',
                data: createdVehicle
            });
        } catch (e) {
            await transaction.rollback();
            
            if (e instanceof ApiError) {
                next(e);
            } else {
                console.error('Ошибка при создании транспортного средства:', e);
                next(ApiError.internal('Произошла ошибка при регистрации транспортного средства'));
            }
        }
    }
}

module.exports = new VehicleController();