const { Owner, NaturalPerson, LegalEntity, RegistrationDoc } = require('../../models/associations');
const ApiError = require('../../error/ApiError');
const sequelize = require('../../db');
const { translateError } = require('../../error/errorMessage');
const { naturalPersonSchema, legalEntitySchema } = require('../../validations/ownerShema');

class OwnerRegistrationController {
    async createNaturalPerson(req, res, next) {
        const transaction = await sequelize.transaction();
        try {
            const { error, value } = naturalPersonSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const { passportData, address, lastName, firstName, patronymic } = value;

            const existingPerson = await NaturalPerson.findOne({
                where: { passportData },
                transaction
            });
            if (existingPerson) {
                throw ApiError.conflict(translateError('Natural person with this passport already exists'));
            }

            let owner = await Owner.findOne({ where: { address }, transaction });
            if (!owner) {
                owner = await Owner.create({ address }, { transaction });
            }

            const naturalPerson = await NaturalPerson.create({
                passportData,
                address,
                lastName,
                firstName,
                patronymic
            }, { transaction });

            await transaction.commit();
            res.status(201).json(naturalPerson);
        } catch (e) {
            await transaction.rollback();
            console.error('CREATE NATURAL PERSON ERROR:', e);
            next(e);
        }
    }

    async createLegalEntity(req, res, next) {
        const transaction = await sequelize.transaction();
        try {
            const { error, value } = legalEntitySchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const { taxNumber, address, companyName } = value;

            const existingEntity = await LegalEntity.findOne({
                where: { taxNumber },
                transaction
            });
            if (existingEntity) {
                throw ApiError.conflict(translateError('Legal entity with this tax number already exists'));
            }

            let owner = await Owner.findOne({ where: { address }, transaction });
            if (!owner) {
                owner = await Owner.create({ address }, { transaction });
            }

            const legalEntity = await LegalEntity.create({
                taxNumber,
                address,
                companyName
            }, { transaction });

            await transaction.commit();
            res.status(201).json(legalEntity);
        } catch (e) {
            await transaction.rollback();
            console.error('CREATE LEGAL ENTITY ERROR:', e);
            next(e);
        }
    }

    async deleteNaturalPerson(req, res, next) {
        const transaction = await sequelize.transaction();
        try {
            const { passportData } = req.params;

            if (!/^\d{4} \d{6}$/.test(passportData)) {
                throw ApiError.badRequest(translateError('Invalid passport format (should be "XXXX XXXXXX")'));
            }

            const person = await NaturalPerson.findOne({
                where: { passportData },
                transaction
            });

            if (!person) {
                throw ApiError.notFound(translateError('Natural person not found'));
            }

            const address = person.address;

            await person.destroy({ transaction });

            const linkedNaturalPersonCount = await NaturalPerson.count({ 
                where: { address }, 
                transaction 
            });
            const linkedLegalEntityCount = await LegalEntity.count({ 
                where: { address }, 
                transaction 
            });
            const linkedRegDocsCount = await RegistrationDoc.count({ 
                where: { address }, 
                transaction 
            });

            if (linkedNaturalPersonCount === 0 && linkedLegalEntityCount === 0 && linkedRegDocsCount === 0) {
                await Owner.destroy({ 
                    where: { address }, 
                    transaction 
                });
            }

            await transaction.commit();
            res.status(204).send();
        } catch (e) {
            await transaction.rollback();
            console.error('DELETE NATURAL PERSON ERROR:', e);
            next(e);
        }
    }

    async deleteLegalEntity(req, res, next) {
        const transaction = await sequelize.transaction();
        try {
            const { taxNumber } = req.params;

            if (!/^\d{10}$/.test(taxNumber)) {
                throw ApiError.badRequest(translateError('Invalid tax number format (should be 10 digits)'));
            }

            const entity = await LegalEntity.findOne({
                where: { taxNumber },
                transaction
            });

            if (!entity) {
                throw ApiError.notFound(translateError('Legal entity not found'));
            }

            const address = entity.address;

            await entity.destroy({ transaction });

            const linkedNaturalPersonCount = await NaturalPerson.count({ 
                where: { address }, 
                transaction 
            });
            const linkedLegalEntityCount = await LegalEntity.count({ 
                where: { address }, 
                transaction 
            });
            const linkedRegDocsCount = await RegistrationDoc.count({ 
                where: { address }, 
                transaction 
            });

            if (linkedNaturalPersonCount === 0 && linkedLegalEntityCount === 0 && linkedRegDocsCount === 0) {
                await Owner.destroy({ 
                    where: { address }, 
                    transaction 
                });
            }

            await transaction.commit();
            res.status(204).send();
        } catch (e) {
            await transaction.rollback();
            console.error('DELETE LEGAL ENTITY ERROR:', e);
            next(e);
        }
    }
}

module.exports = new OwnerRegistrationController();