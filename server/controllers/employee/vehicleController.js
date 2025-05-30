const { TransportVehicle } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');
const { vehicleUpdateSchema, vehiclePatchSchema } = require('../../validations/vehicleShema');

class TransportVehicleController {
    async getAllTransportVehicle(req, res, next) {
        try {
            const { error, value } = Joi.object({
                page: Joi.number().integer().min(1).default(1),
                limit: Joi.number().integer().min(1).max(100).default(10),
                sortBy: Joi.string().valid('createdAt', 'releaseYear', 'makeAndModel', 'engineVolume').default('createdAt'),
                sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
                vin: Joi.string().pattern(/^[A-HJ-NPR-Z0-9]{17}$/).optional(),
                makeAndModel: Joi.string().min(2).max(100).optional(),
                releaseYear: Joi.string().pattern(/^(19|20)\d{2}$/).optional(),
                manufacture: Joi.string().min(2).max(100).optional(),
                typeOfDrive: Joi.string().valid('FWD', 'RWD', 'AWD', '4WD').optional(),
                bodyColor: Joi.string().min(2).max(50).optional(),
                transmissionType: Joi.string().valid('MT', 'AT', 'AMT', 'CVT', 'DCT').optional(),
                steeringWheel: Joi.string().valid('Правостороннее', 'Левостороннее').optional(),
                engineModel: Joi.string().pattern(/^[A-Z0-9-]+$/).optional(),
                engineVolumeFrom: Joi.number().integer().min(500).max(7400).optional(),
                engineVolumeTo: Joi.number().integer().min(500).max(7400).optional()
            }).validate(req.query);

            if (error) throw ApiError.badRequest(error.details[0].message);

            const where = {};
            if (value.vin) where.vin = value.vin;
            if (value.makeAndModel) where.makeAndModel = { [Op.iLike]: `%${value.makeAndModel}%` };
            if (value.releaseYear) where.releaseYear = value.releaseYear;
            if (value.manufacture) where.manufacture = { [Op.iLike]: `%${value.manufacture}%` };
            if (value.typeOfDrive) where.typeOfDrive = value.typeOfDrive;
            if (value.bodyColor) where.bodyColor = { [Op.iLike]: `%${value.bodyColor}%` };
            if (value.transmissionType) where.transmissionType = value.transmissionType;
            if (value.steeringWheel) where.steeringWheel = value.steeringWheel;
            if (value.engineModel) where.engineModel = { [Op.iLike]: `%${value.engineModel}%` };
            if (value.engineVolumeFrom || value.engineVolumeTo) {
                where.engineVolume = {};
                if (value.engineVolumeFrom) where.engineVolume[Op.gte] = value.engineVolumeFrom;
                if (value.engineVolumeTo) where.engineVolume[Op.lte] = value.engineVolumeTo;
            }

            const offset = (value.page - 1) * value.limit;
            const { count, rows } = await TransportVehicle.findAndCountAll({
                where,
                limit: value.limit,
                offset,
                order: [[value.sortBy, value.sortOrder]]
            });

            res.json({
                data: rows,
                pagination: {
                    total: count,
                    page: value.page,
                    limit: value.limit,
                    totalPages: Math.ceil(count / value.limit)
                }
            });
        } catch (e) {
            console.error("GET ALL VEHICLES ERROR:", e);            
            next(e);
        }
    }

    async getTransportVehicleByVin(req, res, next) {
        try {
            const { vin } = req.params;

            if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
                throw ApiError.badRequest('Неверный формат VIN. VIN должен содержать 17 символов и не может содержать буквы I, O, Q');
            }

            const vehicle = await TransportVehicle.findOne({
                where: { vin },
                attributes: [
                    'vin',
                    'makeAndModel',
                    'releaseYear',
                    'manufacture',
                    'typeOfDrive',
                    'power',
                    'chassisNumber',
                    'bodyNumber',
                    'bodyColor',
                    'transmissionType',
                    'steeringWheel',
                    'engineModel',
                    'engineVolume'
                ]
            });

            if (!vehicle) {
                throw ApiError.notFound('Транспортное средство не найдено');
            }

            return res.json({
                data: vehicle
            });
        } catch (e) {
            console.error("GET BY VIN ERROR:", e);
            next(e);
        }
    }

    async updateTransportVehicle(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { vin } = req.params;

            if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
                throw ApiError.badRequest('Неверный формат VIN. VIN должен содержать 17 символов и не может содержать буквы I, O, Q');
            }

            const { error } = vehicleUpdateSchema.validate(req.body);
            if (error) {
                throw ApiError.badRequest(error.details[0].message);
            }

            const vehicle = await TransportVehicle.findOne({
                where: { vin },
                transaction
            });

            if (!vehicle) {
                throw ApiError.notFound('Транспортное средство не найдено');
            }

            const updateData = {
                ...req.body,
                chassisNumber: req.body.hasChassisNumber ? vin : null
            };

            await vehicle.update(updateData, {
                transaction,
                fields: [
                    'makeAndModel',
                    'releaseYear',
                    'manufacture',
                    'typeOfDrive',
                    'power',
                    'bodyColor',
                    'transmissionType',
                    'steeringWheel',
                    'engineModel',
                    'engineVolume',
                    'chassisNumber'
                ]
            });

            await transaction.commit();

            const updatedVehicle = await TransportVehicle.findOne({
                where: { vin },
                attributes: [
                    'vin',
                    'makeAndModel',
                    'releaseYear',
                    'manufacture',
                    'typeOfDrive',
                    'power',
                    'chassisNumber',
                    'bodyNumber',
                    'bodyColor',
                    'transmissionType',
                    'steeringWheel',
                    'engineModel',
                    'engineVolume'
                ]
            });

            return res.json({
                message: 'Транспортное средство успешно обновлено',
                data: updatedVehicle
            });
        } catch (e) {
            await transaction.rollback();
            console.error("UPDATE VEHICLE ERROR:", e);
            next(e);
        }
    }

    async patchTransportVehicle(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { vin } = req.params;

            if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
                throw ApiError.badRequest('Неверный формат VIN. VIN должен содержать 17 символов и не может содержать буквы I, O, Q');
            }

            const { error } = vehiclePatchSchema.validate(req.body);
            if (error) {
                throw ApiError.badRequest(error.details[0].message);
            }

            const vehicle = await TransportVehicle.findOne({
                where: { vin },
                transaction
            });

            if (!vehicle) {
                throw ApiError.notFound('Транспортное средство не найдено');
            }

            const updateData = {
                ...req.body
            };

            if ('hasChassisNumber' in req.body) {
                updateData.chassisNumber = req.body.hasChassisNumber ? vin : null;
            }

            await vehicle.update(updateData, {
                transaction,
                fields: Object.keys(updateData).filter(field => [
                    'makeAndModel',
                    'releaseYear',
                    'manufacture',
                    'typeOfDrive',
                    'power',
                    'bodyColor',
                    'transmissionType',
                    'steeringWheel',
                    'engineModel',
                    'engineVolume',
                    'chassisNumber'
                ].includes(field))
            });

            await transaction.commit();

            const updatedVehicle = await TransportVehicle.findOne({
                where: { vin },
                attributes: [
                    'vin',
                    'makeAndModel',
                    'releaseYear',
                    'manufacture',
                    'typeOfDrive',
                    'power',
                    'chassisNumber',
                    'bodyNumber',
                    'bodyColor',
                    'transmissionType',
                    'steeringWheel',
                    'engineModel',
                    'engineVolume'
                ]
            });

            return res.json({
                message: 'Транспортное средство успешно обновлено',
                data: updatedVehicle
            });
        } catch (e) {
            await transaction.rollback();
            console.error("PATCH VEHICLE ERROR:", e);
            next(e);
        }
    }
}

module.exports = new TransportVehicleController();