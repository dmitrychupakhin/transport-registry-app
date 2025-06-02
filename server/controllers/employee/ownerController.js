const { Owner, NaturalPerson, LegalEntity, RegistrationDoc } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const sequelize = require('../../db');
const { naturalPersonPutSchema, naturalPersonPatchSchema, legalEntityPutSchema, legalEntityPatchSchema } = require('../../validations/ownerShema');

class OwnerController {

    async getAllNaturalPersons(req, res, next) {
        try {
            const { page = 1, limit = 10, sortBy = 'passportData', sortOrder = 'ASC' } = req.query;
            
            const allowedSortFields = ['passportData', 'address'];
            if (!allowedSortFields.includes(sortBy)) {
                throw ApiError.badRequest('Invalid sort field. Allowed fields: passportData, address');
            }
            
            if (!['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
                throw ApiError.badRequest('Invalid sort order. Use ASC or DESC');
            }

            const offset = (page - 1) * limit;
            
            const { count, rows } = await NaturalPerson.findAndCountAll({
                attributes: ['passportData', 'lastName', 'firstName', 'patronymic', 'address'],
                order: [[sortBy, sortOrder.toUpperCase()]],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                data: rows
            });
        } catch (e) {
            console.error("GET ALL NATURAL PERSONS ERROR:", e);
            next(e);
        }
    }

    async getNaturalPersonByPassport(req, res, next) {
        try {
            const { passport } = req.params;

            if (!/^\d{4} \d{6}$/.test(passport)) {
                throw ApiError.badRequest('Invalid passport format (should be "XXXX XXXXXX")');
            }

            const person = await NaturalPerson.findOne({
                where: { passportData: passport },
                attributes: ['passportData', 'lastName', 'firstName', 'patronymic', 'address']
            });

            if (!person) {
                throw ApiError.notFound('Natural person not found');
            }
            res.json(person);
        } catch (e) {
            console.error("GET BY PASSPORT ERROR:", e);
            next(e);
        }
    }

    async updateNaturalPerson(req, res, next) {
        const transaction = await sequelize.transaction();
        try {            
            const { passport } = req.params;
            
            if (!passport) {
                return next(ApiError.badRequest('Passport number is required'));
            }

            if (!/^\d{4} \d{6}$/.test(passport)) {
                return next(ApiError.badRequest('Invalid passport format (should be "XXXX XXXXXX")'));
            }

            const { error } = naturalPersonPutSchema.validate(req.body);
            
            if (error) {
                return next(ApiError.badRequest(error.details[0].message));
            }

            const updateData = req.body;
            
            const naturalPerson = await NaturalPerson.findOne({
                where: { passportData: passport },
                transaction
            });

            if (!naturalPerson) {
                return next(ApiError.notFound('Natural person not found'));
            }
            
            const oldAddress = naturalPerson.address;

            // Check if there are any registration documents where this person is the owner
            const registrationDocs = await RegistrationDoc.findAll({
                where: { 
                    documentOwner: passport  // Проверяем только по documentOwner, а не по адресу
                },
                transaction
            });

            // Create or find new owner for the new address
            let newOwner = await Owner.findOne({ 
                where: { address: updateData.address }, 
                transaction 
            });
            if (!newOwner) {
                newOwner = await Owner.create({ address: updateData.address }, { transaction }); 
            }

            // If this person owns any registration documents, update their addresses
            if (registrationDocs.length > 0) {
                await RegistrationDoc.update(
                    { address: updateData.address },
                    { 
                        where: { 
                            documentOwner: passport  // Обновляем только документы этого владельца
                        },
                        transaction
                    }
                );
            }
            
            // Update the natural person
            const [updatedRows] = await NaturalPerson.update(
                updateData,
                { 
                    where: { passportData: passport },
                    transaction
                }
            );

            if (updatedRows === 0) {
                throw new Error('Failed to update natural person');
            }

            // Check if the old address is still in use by any natural persons or legal entities
            const linkedNaturalPersonCount = await NaturalPerson.count({ 
                where: { address: oldAddress }, 
                transaction 
            });
            const linkedLegalEntityCount = await LegalEntity.count({ 
                where: { address: oldAddress }, 
                transaction 
            });
            const linkedRegDocsCount = await RegistrationDoc.count({ 
                where: { address: oldAddress }, 
                transaction 
            });

            // Delete the old owner record if no one is using it anymore
            if (linkedNaturalPersonCount === 0 && linkedLegalEntityCount === 0 && linkedRegDocsCount === 0) {
                await Owner.destroy({ 
                    where: { address: oldAddress }, 
                    transaction 
                });
            }

            await transaction.commit();

            const updatedNaturalPerson = await NaturalPerson.findOne({
                where: { passportData: passport },
                include: [{
                    model: Owner,
                    as: 'owner'
                }]
            });

            return res.json(updatedNaturalPerson);
        } catch (error) {
            await transaction.rollback();
            console.error('Error in updateNaturalPerson:', error);
            return next(ApiError.internal(error.message));
        }
    }

    async patchNaturalPerson(req, res, next) {
        const transaction = await sequelize.transaction();
        try {
            const { passport } = req.params;
            const { error } = naturalPersonPatchSchema.validate(req.body);
            
            if (error) {
                return next(ApiError.badRequest(error.details[0].message));
            }

            const updateData = req.body;

            const naturalPerson = await NaturalPerson.findOne({
                where: { passportData: passport },
                transaction
            });

            if (!naturalPerson) {
                return next(ApiError.notFound('Natural person not found'));
            }

            if (updateData.address) {
                const oldAddress = naturalPerson.address;

                // First, create or find the new owner record
                let newOwner = await Owner.findOne({ 
                    where: { address: updateData.address }, 
                    transaction 
                });
                if (!newOwner) {
                    newOwner = await Owner.create({ address: updateData.address }, { transaction });
                }

                // Then check if there are any registration documents where this person is the owner
                const registrationDocs = await RegistrationDoc.findAll({
                    where: { 
                        address: oldAddress,
                        documentOwner: passport
                    },
                    transaction
                });

                // Update registration documents address if they exist
                if (registrationDocs.length > 0) {
                    await RegistrationDoc.update(
                        { address: updateData.address },
                        { 
                            where: { 
                                address: oldAddress,
                                documentOwner: passport
                            },
                            transaction
                        }
                    );
                }

                // Update the natural person
                const [updatedRows] = await NaturalPerson.update(
                    updateData,
                    { 
                        where: { passportData: passport },
                        transaction
                    }
                );

                if (updatedRows === 0) {
                    throw new Error('Failed to update natural person');
                }

                // Check if the old address is still in use
                const linkedNaturalPersonCount = await NaturalPerson.count({ 
                    where: { address: oldAddress }, 
                    transaction 
                });
                const linkedLegalEntityCount = await LegalEntity.count({ 
                    where: { address: oldAddress }, 
                    transaction 
                });
                const linkedRegDocsCount = await RegistrationDoc.count({ 
                    where: { address: oldAddress }, 
                    transaction 
                });

                // Delete the old owner record if no one is using it anymore
                if (linkedNaturalPersonCount === 0 && linkedLegalEntityCount === 0 && linkedRegDocsCount === 0) {
                    await Owner.destroy({ 
                        where: { address: oldAddress }, 
                        transaction 
                    });
                }
            } else {
                // If we're not updating the address, just update other fields
                const [updatedRows] = await NaturalPerson.update(
                    updateData,
                    { 
                        where: { passportData: passport },
                        transaction
                    }
                );

                if (updatedRows === 0) {
                    throw new Error('Failed to update natural person');
                }
            }

            await transaction.commit();

            const updatedNaturalPerson = await NaturalPerson.findOne({
                where: { passportData: passport },
                include: [{
                    model: Owner,
                    as: 'owner'
                }]
            });

            return res.json(updatedNaturalPerson);
        } catch (error) {
            await transaction.rollback();
            console.error('Error in patchNaturalPerson:', error);
            return next(ApiError.internal(error.message));
        }
    }

    async getAllLegalEntities(req, res, next) {
        try {
            const { page = 1, limit = 10, sortBy = 'taxNumber', sortOrder = 'ASC' } = req.query;
            
            const allowedSortFields = ['taxNumber', 'address'];
            if (!allowedSortFields.includes(sortBy)) {
                throw ApiError.badRequest('Invalid sort field. Allowed fields: taxNumber, address');
            }
            
            if (!['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
                throw ApiError.badRequest('Invalid sort order. Use ASC or DESC');
            }

            const offset = (page - 1) * limit;
            
            const { count, rows } = await LegalEntity.findAndCountAll({
                attributes: ['taxNumber', 'companyName', 'address'],
                order: [[sortBy, sortOrder.toUpperCase()]],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                data: rows
            });
        } catch (e) {
            console.error("GET ALL LEGAL ENTITIES ERROR:", e);
            next(e);
        }
    }
    
    async getLegalEntitiesByTax(req, res, next) {
        try {
            const { taxNumber } = req.params;

            if (!/^\d{10}$/.test(taxNumber)) {
                throw ApiError.badRequest('Invalid tax number format (should be 10 digits)');
            }

            const entity = await LegalEntity.findOne({
                where: { taxNumber: taxNumber },
                attributes: ['taxNumber', 'companyName', 'address']
            });

            if (!entity) {
                throw ApiError.notFound('Legal entity not found');
            }

            res.json(entity);
        } catch (e) {
            console.error("GET BY TAX ERROR:", e);
            next(e);
        }
    }

    async updateLegalEntity(req, res, next) {
        const transaction = await sequelize.transaction();
        try {
            const { taxNumber } = req.params;
            const { error } = legalEntityPutSchema.validate(req.body);
            
            if (error) {
                return next(ApiError.badRequest(error.details[0].message));
            }
    
            const updateData = req.body;
    
            const legalEntity = await LegalEntity.findOne({
                where: { taxNumber },
                transaction
            });
    
            if (!legalEntity) {
                return next(ApiError.notFound('Legal entity not found'));
            }
    
            const oldAddress = legalEntity.address;

            // Check if there are any registration documents where this entity is the owner
            const registrationDocs = await RegistrationDoc.findAll({
                where: { 
                    address: oldAddress,
                    documentOwner: taxNumber
                },
                transaction
            });

            // Only update address if this entity is the owner of the registration documents
            if (registrationDocs.length > 0) {
                let newOwner = await Owner.findOne({ 
                    where: { address: updateData.address }, 
                    transaction 
                });
                if (!newOwner) {
                    newOwner = await Owner.create({ address: updateData.address }, { transaction });
                }

                // Update registration documents address
                await RegistrationDoc.update(
                    { address: updateData.address },
                    { 
                        where: { 
                            address: oldAddress,
                            documentOwner: taxNumber
                        },
                        transaction
                    }
                );
            }
    
            const [updatedRows] = await LegalEntity.update(
                updateData,
                { 
                    where: { taxNumber },
                    transaction
                }
            );
    
            if (updatedRows === 0) {
                throw new Error('Failed to update legal entity');
            }
    
            const linkedNaturalPersonCount = await NaturalPerson.count({ 
                where: { address: oldAddress }, 
                transaction 
            });
            const linkedLegalEntityCount = await LegalEntity.count({ 
                where: { address: oldAddress }, 
                transaction 
            });
            const linkedRegDocsCount = await RegistrationDoc.count({ 
                where: { address: oldAddress }, 
                transaction 
            });
    
            if (linkedNaturalPersonCount === 0 && linkedLegalEntityCount === 0 && linkedRegDocsCount === 0) {
                await Owner.destroy({ 
                    where: { address: oldAddress }, 
                    transaction 
                });
            }
    
            await transaction.commit();
    
            const updatedLegalEntity = await LegalEntity.findOne({
                where: { taxNumber },
                include: [{
                    model: Owner,
                    as: 'owner'
                }]
            });
    
            return res.json(updatedLegalEntity);
        } catch (error) {
            await transaction.rollback();
            console.error('Error in putLegalEntity:', error);
            return next(ApiError.internal(error.message));
        }
    }

    async patchLegalEntity(req, res, next) {
        const transaction = await sequelize.transaction();
        try {
            const { taxNumber } = req.params;
            const { error } = legalEntityPatchSchema.validate(req.body);
            
            if (error) {
                return next(ApiError.badRequest(error.details[0].message));
            }

            const updateData = req.body;

            const legalEntity = await LegalEntity.findOne({
                where: { taxNumber },
                transaction
            });

            if (!legalEntity) {
                return next(ApiError.notFound('Legal entity not found'));
            }

            if (updateData.address) {
                const oldAddress = legalEntity.address;

                // Check if there are any registration documents where this entity is the owner
                const registrationDocs = await RegistrationDoc.findAll({
                    where: { 
                        address: oldAddress,
                        documentOwner: taxNumber
                    },
                    transaction
                });

                // Only update address if this entity is the owner of the registration documents
                if (registrationDocs.length > 0) {
                    let newOwner = await Owner.findOne({ 
                        where: { address: updateData.address }, 
                        transaction 
                    });
                    if (!newOwner) {
                        newOwner = await Owner.create({ address: updateData.address }, { transaction });
                    }

                    // Update registration documents address
                    await RegistrationDoc.update(
                        { address: updateData.address },
                        { 
                            where: { 
                                address: oldAddress,
                                documentOwner: taxNumber
                            },
                            transaction
                        }
                    );
                }

                const [updatedRows] = await LegalEntity.update(
                    { address: updateData.address },
                    { 
                        where: { taxNumber },
                        transaction
                    }
                );

                if (updatedRows === 0) {
                    throw new Error('Failed to update legal entity');
                }

                const linkedNaturalPersonCount = await NaturalPerson.count({ 
                    where: { address: oldAddress }, 
                    transaction 
                });
                const linkedLegalEntityCount = await LegalEntity.count({ 
                    where: { address: oldAddress }, 
                    transaction 
                });
                const linkedRegDocsCount = await RegistrationDoc.count({ 
                    where: { address: oldAddress }, 
                    transaction 
                });

                if (linkedNaturalPersonCount === 0 && linkedLegalEntityCount === 0 && linkedRegDocsCount === 0) {
                    await Owner.destroy({ 
                        where: { address: oldAddress }, 
                        transaction 
                    });
                }
            } else {
                await legalEntity.update(updateData, { transaction });
            }

            await transaction.commit();
           
            const updatedLegalEntity = await LegalEntity.findOne({
                where: { taxNumber },
                include: [{
                    model: Owner,
                    as: 'owner'
                }]
            });

            return res.json(updatedLegalEntity);
        } catch (error) {
            await transaction.rollback();
            console.error('Error in patchLegalEntity:', error);
            return next(ApiError.internal(error.message));
        }
    }
}

module.exports = new OwnerController();