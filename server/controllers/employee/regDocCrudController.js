const { RegistrationDoc, Employee, TransportVehicle, NaturalPerson, LegalEntity } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');

const regDocSchema = Joi.object({
    registrationNumber: Joi.string().pattern(/^[A-Z0-9]{8,20}$/).required(),
    address: Joi.string().min(5).max(255).required(),
    pts: Joi.string().pattern(/^[A-Z0-9]{10,20}$/).required(),
    sts: Joi.string().pattern(/^[A-Z0-9]{10,20}$/).required(),
    registrationDate: Joi.date().iso().required(),
    vin: Joi.string().pattern(/^[A-Z0-9]{17}$/).required(),
    ownerPassport: Joi.string().pattern(/^[A-Z0-9]{10}$/).optional(),
    ownerTaxNumber: Joi.string().pattern(/^[A-Z0-9]{10,15}$/).optional()
});

class RegDocCrudController {
    /**
     * Get all registration documents with filtering
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getAllRegDoc(req, res, next) {
        try {
            const { error } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(10),
                page: Joi.number().integer().min(1).default(1),
                search: Joi.string().optional(),
                vin: Joi.string().pattern(/^[A-Z0-9]{17}$/).optional(),
                ownerPassport: Joi.string().pattern(/^[A-Z0-9]{10}$/).optional(),
                ownerTaxNumber: Joi.string().pattern(/^[A-Z0-9]{10,15}$/).optional(),
                startDate: Joi.date().iso().optional(),
                endDate: Joi.date().iso().optional()
            }).validate(req.query);

            if (error) throw ApiError.badRequest(error.details[0].message);

            const { limit, page, search, vin, ownerPassport, ownerTaxNumber, startDate, endDate } = req.query;
            const offset = (page - 1) * limit;

            const where = {};
            if (search) {
                where[Op.or] = [
                    { registrationNumber: { [Op.like]: `%${search}%` }},
                    { pts: { [Op.like]: `%${search}%` }},
                    { sts: { [Op.like]: `%${search}%` }}
                ];
            }
            if (vin) where.vin = vin;
            if (ownerPassport) where.ownerPassport = ownerPassport;
            if (ownerTaxNumber) where.ownerTaxNumber = ownerTaxNumber;
            if (startDate && endDate) {
                where.registrationDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
            }

            const { count, rows } = await RegistrationDoc.findAndCountAll({
                where,
                limit,
                offset,
                include: [
                    {
                        model: TransportVehicle,
                        attributes: ['vin', 'makeAndModel', 'releaseYear']
                    },
                    {
                        model: NaturalPerson,
                        attributes: ['passportData', 'lastName', 'firstName', 'patronymic'],
                        required: false
                    },
                    {
                        model: LegalEntity,
                        attributes: ['taxNumber', 'companyName'],
                        required: false
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
     * Get registration document by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getRegDocById(req, res, next) {
        try {
            const { id } = req.params;

            if (!/^[A-Z0-9]{8,20}$/.test(id)) {
                throw ApiError.badRequest('Invalid registration number format');
            }

            const doc = await RegistrationDoc.findOne({
                where: { registrationNumber: id },
                include: [
                    {
                        model: TransportVehicle,
                        attributes: ['vin', 'makeAndModel', 'releaseYear', 'bodyColor']
                    },
                    {
                        model: NaturalPerson,
                        attributes: ['passportData', 'lastName', 'firstName', 'patronymic', 'address'],
                        required: false
                    },
                    {
                        model: LegalEntity,
                        attributes: ['taxNumber', 'companyName', 'address'],
                        required: false
                    }
                ]
            });

            if (!doc) {
                throw ApiError.notFound('Registration document not found');
            }

            res.json(doc);
        } catch (e) {
            next(e);
        }
    }

    /**
     * Create new registration document
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async createRegDoc(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { error } = regDocSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const { registrationNumber, vin, ownerPassport, ownerTaxNumber } = req.body;

            // Проверка на дубликат номера регистрации
            const existingDoc = await RegistrationDoc.findOne({
                where: { registrationNumber },
                transaction
            });

            if (existingDoc) {
                throw ApiError.conflict('Document with this registration number already exists');
            }

            // Проверка существования ТС
            const vehicle = await TransportVehicle.findOne({
                where: { vin },
                transaction
            });

            if (!vehicle) {
                throw ApiError.badRequest('Vehicle with this VIN does not exist');
            }

            // Проверка существования владельца
            if (ownerPassport) {
                const owner = await NaturalPerson.findOne({
                    where: { passportData: ownerPassport },
                    transaction
                });
                if (!owner) {
                    throw ApiError.badRequest('Natural person owner not found');
                }
            } else if (ownerTaxNumber) {
                const owner = await LegalEntity.findOne({
                    where: { taxNumber: ownerTaxNumber },
                    transaction
                });
                if (!owner) {
                    throw ApiError.badRequest('Legal entity owner not found');
                }
            } else {
                throw ApiError.badRequest('Either ownerPassport or ownerTaxNumber must be provided');
            }

            const newDoc = await RegistrationDoc.create(req.body, {
                transaction,
                returning: true
            });

            await transaction.commit();
            res.status(201).json(newDoc);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }

    /**
     * Update registration document
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async updateRegDoc(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;
            const { error } = regDocSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const doc = await RegistrationDoc.findByPk(id, { transaction });
            if (!doc) {
                throw ApiError.notFound('Document not found');
            }

            if (req.body.registrationNumber && req.body.registrationNumber !== id) {
                throw ApiError.badRequest('Cannot change registration number');
            }

            // Проверка существования ТС если VIN изменяется
            if (req.body.vin && req.body.vin !== doc.vin) {
                const vehicle = await TransportVehicle.findOne({
                    where: { vin: req.body.vin },
                    transaction
                });
                if (!vehicle) {
                    throw ApiError.badRequest('Vehicle with this VIN does not exist');
                }
            }

            // Проверка существования владельца если он изменяется
            if (req.body.ownerPassport && req.body.ownerPassport !== doc.ownerPassport) {
                const owner = await NaturalPerson.findOne({
                    where: { passportData: req.body.ownerPassport },
                    transaction
                });
                if (!owner) {
                    throw ApiError.badRequest('Natural person owner not found');
                }
            } else if (req.body.ownerTaxNumber && req.body.ownerTaxNumber !== doc.ownerTaxNumber) {
                const owner = await LegalEntity.findOne({
                    where: { taxNumber: req.body.ownerTaxNumber },
                    transaction
                });
                if (!owner) {
                    throw ApiError.badRequest('Legal entity owner not found');
                }
            }

            await doc.update(req.body, {
                transaction,
                fields: ['address', 'pts', 'sts', 'registrationDate', 'vin', 'ownerPassport', 'ownerTaxNumber']
            });

            await transaction.commit();
            res.json(doc);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }
}

module.exports = new RegDocCrudController();