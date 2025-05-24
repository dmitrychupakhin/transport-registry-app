const { NaturalPerson, LegalEntity, RegistrationDoc } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');

const naturalPersonSchema = Joi.object({
    passportData: Joi.string().pattern(/^[A-Z0-9]{10}$/).required(),
    address: Joi.string().min(5).max(255).required(),
    lastName: Joi.string().min(2).max(50).required(),
    firstName: Joi.string().min(2).max(50).required(),
    patronymic: Joi.string().min(2).max(50).required()
});

const legalEntitySchema = Joi.object({
    taxNumber: Joi.string().pattern(/^[A-Z0-9]{10,15}$/).required(),
    address: Joi.string().min(5).max(255).required(),
    companyName: Joi.string().min(3).max(100).required()
});

class OwnerController {
    /**
     * Get natural person by passport data
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getNaturalPersonById(req, res, next) {
        try {
            const { id } = req.params;

            if (!/^[A-Z0-9]{10}$/.test(id)) {
                throw ApiError.badRequest('Invalid passport format');
            }

            const person = await NaturalPerson.findOne({
                where: { passportData: id },
                include: [{
                    model: RegistrationDoc,
                    attributes: ['registrationNumber', 'registrationDate'],
                    required: false
                }],
                attributes: ['passportData', 'lastName', 'firstName', 'patronymic', 'address']
            });

            if (!person) {
                throw ApiError.notFound('Owner not found');
            }

            res.json(person);
        } catch (e) {
            next(e);
        }
    }

    /**
     * Update natural person
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async updateNaturalPerson(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;
            const { error } = naturalPersonSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            if (req.body.passportData && req.body.passportData !== id) {
                throw ApiError.badRequest('Cannot change passport data');
            }

            const person = await NaturalPerson.findOne({
                where: { passportData: id },
                transaction
            });

            if (!person) {
                throw ApiError.notFound('Owner not found');
            }

            // Проверка на существование регистрационных документов
            const hasRegDocs = await RegistrationDoc.findOne({
                where: { ownerPassport: id },
                transaction
            });

            if (hasRegDocs) {
                // Если есть регистрационные документы, запрещаем изменение некоторых полей
                const restrictedFields = ['passportData', 'lastName', 'firstName', 'patronymic'];
                for (const field of restrictedFields) {
                    if (req.body[field] && req.body[field] !== person[field]) {
                        throw ApiError.badRequest(`Cannot change ${field} for owner with registration documents`);
                    }
                }
            }

            await person.update(req.body, {
                transaction,
                fields: ['address']
            });

            await transaction.commit();
            res.json(person);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }

    /**
     * Get legal entity by tax number
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getLegalEntitiesById(req, res, next) {
        try {
            const { id } = req.params;

            if (!/^[A-Z0-9]{10,15}$/.test(id)) {
                throw ApiError.badRequest('Invalid tax number format');
            }

            const entity = await LegalEntity.findOne({
                where: { taxNumber: id },
                include: [{
                    model: RegistrationDoc,
                    attributes: ['registrationNumber', 'registrationDate'],
                    required: false
                }],
                attributes: ['taxNumber', 'companyName', 'address']
            });

            if (!entity) {
                throw ApiError.notFound('Legal entity not found');
            }

            res.json(entity);
        } catch (e) {
            next(e);
        }
    }

    /**
     * Update legal entity
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async updateLegalEntities(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;
            const { error } = legalEntitySchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            if (req.body.taxNumber && req.body.taxNumber !== id) {
                throw ApiError.badRequest('Cannot change tax number');
            }

            const entity = await LegalEntity.findOne({
                where: { taxNumber: id },
                transaction
            });

            if (!entity) {
                throw ApiError.notFound('Legal entity not found');
            }

            // Проверка на существование регистрационных документов
            const hasRegDocs = await RegistrationDoc.findOne({
                where: { ownerTaxNumber: id },
                transaction
            });

            if (hasRegDocs) {
                // Если есть регистрационные документы, запрещаем изменение некоторых полей
                const restrictedFields = ['taxNumber', 'companyName'];
                for (const field of restrictedFields) {
                    if (req.body[field] && req.body[field] !== entity[field]) {
                        throw ApiError.badRequest(`Cannot change ${field} for legal entity with registration documents`);
                    }
                }
            }

            await entity.update(req.body, {
                transaction,
                fields: ['address']
            });

            await transaction.commit();
            res.json(entity);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }
}

module.exports = new OwnerController();