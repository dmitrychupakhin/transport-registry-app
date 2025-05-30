const { RegistrationDoc, NaturalPerson, LegalEntity, Owner, RegistrationOp, TransportVehicle } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');

const regDocSchema = Joi.object({
    registrationNumber: Joi.string().pattern(/^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$/).required()
        .messages({ 'string.pattern.base': 'Registration number must match format: А123АА77 (1 letter + 3 digits + 2 letters + 2-3 digits)' }),
    address: Joi.string().min(8).max(255).required(),
    pts: Joi.string().pattern(/^\d{2} [А-Я]{2} \d{6}$/).required()
        .messages({ 'string.pattern.base': 'PTS must match format: 12 АБ 345678 (2 digits + space + 2 uppercase Russian letters + space + 6 digits)' }),
    sts: Joi.string().pattern(/^\d{2} \d{2} \d{6}$/).required()
        .messages({ 'string.pattern.base': 'STS must match format: 12 34 567890 (2 digits + space + 2 digits + space + 6 digits)' }),
    registrationDate: Joi.date().iso().required(),
    documentOwner: Joi.string().required()
        .custom((value, helpers) => {
            if (value.length === 11) {
                if (!/^\d{4} \d{6}$/.test(value)) {
                    return helpers.error('any.invalid', { message: 'Invalid passport format (should be "1234 567890")' });
                }
            } else if (value.length === 10) {
                if (!/^\d{10}$/.test(value)) {
                    return helpers.error('any.invalid', { message: 'Invalid tax number format (should be 10 digits)' });
                }
            } else {
                return helpers.error('any.invalid', { message: 'documentOwner must be either passport (11 chars) or tax number (10 chars)' });
            }
            return value;
        })
});

const regDocPutSchema = Joi.object({
    address: Joi.string().min(8).max(255).required(),
    pts: Joi.string().pattern(/^\d{2} [А-Я]{2} \d{6}$/).required()
        .messages({ 'string.pattern.base': 'PTS must match format: 12 АБ 345678 (2 digits + space + 2 uppercase Russian letters + space + 6 digits)' }),
    sts: Joi.string().pattern(/^\d{2} \d{2} \d{6}$/).required()
        .messages({ 'string.pattern.base': 'STS must match format: 12 34 567890 (2 digits + space + 2 digits + space + 6 digits)' }),
    registrationDate: Joi.date().iso().required(),
    documentOwner: Joi.string().required()
        .custom((value, helpers) => {
            if (value.length === 11) {
                if (!/^\d{4} \d{6}$/.test(value)) {
                    return helpers.error('any.invalid', { message: 'Invalid passport format (should be "1234 567890")' });
                }
            } else if (value.length === 10) {
                if (!/^\d{10}$/.test(value)) {
                    return helpers.error('any.invalid', { message: 'Invalid tax number format (should be 10 digits)' });
                }
            } else {
                return helpers.error('any.invalid', { message: 'documentOwner must be either passport (11 chars) or tax number (10 chars)' });
            }
            return value;
        })
});

const regDocPatchSchema = Joi.object({
    address: Joi.string().min(8).max(255),
    pts: Joi.string().pattern(/^\d{2} [А-Я]{2} \d{6}$/)
        .messages({ 'string.pattern.base': 'PTS must match format: 12 АБ 345678 (2 digits + space + 2 uppercase Russian letters + space + 6 digits)' }),
    sts: Joi.string().pattern(/^\d{2} \d{2} \d{6}$/)
        .messages({ 'string.pattern.base': 'STS must match format: 12 34 567890 (2 digits + space + 2 digits + space + 6 digits)' }),
    registrationDate: Joi.date().iso(),
    documentOwner: Joi.string()
        .custom((value, helpers) => {
            if (value.length === 11) {
                if (!/^\d{4} \d{6}$/.test(value)) {
                    return helpers.error('any.invalid', { message: 'Invalid passport format (should be "1234 567890")' });
                }
            } else if (value.length === 10) {
                if (!/^\d{10}$/.test(value)) {
                    return helpers.error('any.invalid', { message: 'Invalid tax number format (should be 10 digits)' });
                }
            } else {
                return helpers.error('any.invalid', { message: 'documentOwner must be either passport (11 chars) or tax number (10 chars)' });
            }
            return value;
        })
}).min(1);

class RegDocCrudController {
    async getAllRegDoc(req, res, next) {
        try {
            const { error } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(10),
                page: Joi.number().integer().min(1).default(1),
                search: Joi.string().optional(),
                documentOwner: Joi.string().optional(),
                startDate: Joi.date().iso().optional(),
                endDate: Joi.date().iso().optional()
            }).validate(req.query);

            if (error) throw ApiError.badRequest(error.details[0].message);

            const limit = parseInt(req.query.limit) || 10;
            const page = parseInt(req.query.page) || 1;
            const { search, documentOwner, startDate, endDate } = req.query;
            const offset = (page - 1) * limit;

            const where = {};
            
            if (search) {
                where[Op.or] = [
                    { pts: { [Op.iLike]: `%${search}%` }},
                    { sts: { [Op.iLike]: `%${search}%` }},
                    { address: { [Op.iLike]: `%${search}%` }}
                ];
            }

            if (documentOwner) {
                where.documentOwner = documentOwner;
            }

            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                
                where.registrationDate = {
                    [Op.between]: [start, end]
                };
            }

            const { count, rows } = await RegistrationDoc.findAndCountAll({
                where,
                limit,
                offset,
                include: [
                    {
                        model: Owner,
                        as: 'owner',
                        attributes: ['address']
                    }
                ],
                order: [['registrationDate', 'DESC']]
            });

            const docsWithOwner = await Promise.all(rows.map(async (doc) => {
                const docJson = doc.toJSON();
                if (doc.documentOwner.length === 11) {
                    const naturalPerson = await NaturalPerson.findOne({
                        where: { passportData: doc.documentOwner },
                        attributes: ['passportData', 'lastName', 'firstName', 'patronymic', 'address']
                    });
                    if (naturalPerson) {
                        docJson.owner = {
                            type: 'naturalPerson',
                            ...naturalPerson.toJSON()
                        };
                    }
                } else {
                    const legalEntity = await LegalEntity.findOne({
                        where: { taxNumber: doc.documentOwner },
                        attributes: ['taxNumber', 'companyName', 'address']
                    });
                    if (legalEntity) {
                        docJson.owner = {
                            type: 'legalEntity',
                            ...legalEntity.toJSON()
                        };
                    }
                }
                return docJson;
            }));

            res.json({
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: page,
                data: docsWithOwner
            });
        } catch (e) {
            console.error('GET ALL ERROR:', e);
            next(ApiError.internal(e.message));
        }
    }

    async getRegDocByRegNumber(req, res, next) {
        try {
            const { regNumber } = req.params;

            if (!/^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$/.test(regNumber)) {
                throw ApiError.badRequest('Invalid registration number format');
            }

            const doc = await RegistrationDoc.findOne({
                where: { registrationNumber: regNumber },
                include: [
                    {
                        model: Owner,
                        as: 'owner',
                        attributes: ['address']
                    }
                ]
            });

            if (!doc) {
                throw ApiError.notFound('Registration document not found');
            }

            const docJson = doc.toJSON();
          
            if (doc.documentOwner.length === 11) {
                const naturalPerson = await NaturalPerson.findOne({
                    where: { passportData: doc.documentOwner },
                    attributes: ['passportData', 'lastName', 'firstName', 'patronymic', 'address']
                });
                if (naturalPerson) {
                    docJson.owner = {
                        type: 'naturalPerson',
                        ...naturalPerson.toJSON()
                    };
                }
            } else {
                const legalEntity = await LegalEntity.findOne({
                    where: { taxNumber: doc.documentOwner },
                    attributes: ['taxNumber', 'companyName', 'address']
                });
                if (legalEntity) {
                    docJson.owner = {
                        type: 'legalEntity',
                        ...legalEntity.toJSON()
                    };
                }
            }

            res.json(docJson);
        } catch (e) {
            next(e);
        }
    }

    async createRegDoc(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { error } = regDocSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const { registrationNumber, address, pts, sts, registrationDate, documentOwner } = req.body;

            const existingDoc = await RegistrationDoc.findOne({
                where: { registrationNumber },
                transaction
            });

            if (existingDoc) {
                throw ApiError.conflict('Document with this registration number already exists');
            }

            const existingPts = await RegistrationDoc.findOne({
                where: { pts },
                transaction
            });

            if (existingPts) {
                throw ApiError.conflict('Document with this PTS number already exists');
            }

            const existingSts = await RegistrationDoc.findOne({
                where: { sts },
                transaction
            });

            if (existingSts) {
                throw ApiError.conflict('Document with this STS number already exists');
            }

            let ownerExists = false;
            if (documentOwner.length === 11) {  
                const naturalPerson = await NaturalPerson.findOne({
                    where: { 
                        passportData: documentOwner,
                        address: address
                    },
                    transaction
                });
                if (!naturalPerson) {
                    throw ApiError.badRequest('Natural person with this passport and address not found');
                }
                ownerExists = true;
            } else { 
                const legalEntity = await LegalEntity.findOne({
                    where: { 
                        taxNumber: documentOwner,
                        address: address
                    },
                    transaction
                });
                if (!legalEntity) {
                    throw ApiError.badRequest('Legal entity with this tax number and address not found');
                }
                ownerExists = true;
            }

            let owner = await Owner.findOne({
                where: { address },
                transaction
            });

            if (!owner) {
                if (!ownerExists) {
                    throw ApiError.badRequest('Address not found in any owner records');
                }
                owner = await Owner.create({ address }, { transaction });
            }

            const newDoc = await RegistrationDoc.create({
                registrationNumber,
                address,
                pts,
                sts,
                registrationDate: new Date(registrationDate).toISOString().split('T')[0], 
                documentOwner
            }, {
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

    async updateRegDoc(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { regNumber } = req.params;
            const { error } = regDocPutSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const doc = await RegistrationDoc.findByPk(regNumber, { transaction });
            
            if (!doc) {
                throw ApiError.notFound('Document not found');
            }

            const { address, pts, sts, registrationDate, documentOwner } = req.body;

            let ownerExists = false;
            if (documentOwner.length === 11) {
                const naturalPerson = await NaturalPerson.findOne({
                    where: { 
                        passportData: documentOwner,
                        address: address
                    },
                    transaction
                });
                if (!naturalPerson) {
                    throw ApiError.badRequest('Natural person with this passport and address not found');
                }
                ownerExists = true;
            } else { 
                const legalEntity = await LegalEntity.findOne({
                    where: { 
                        taxNumber: documentOwner,
                        address: address
                    },
                    transaction
                });
                if (!legalEntity) {
                    throw ApiError.badRequest('Legal entity with this tax number and address not found');
                }
                ownerExists = true;
            }

            let owner = await Owner.findOne({
                where: { address },
                transaction
            });

            if (!owner) {
                if (!ownerExists) {
                    throw ApiError.badRequest('Address not found in any owner records');
                }
                owner = await Owner.create({ address }, { transaction });
            }

            if (pts !== doc.pts) {
                const existingPts = await RegistrationDoc.findOne({
                    where: { 
                        pts,
                        registrationNumber: { [Op.ne]: regNumber }
                    },
                    transaction
                });
                if (existingPts) {
                    throw ApiError.conflict('PTS number already in use');
                }
            }

            if (sts !== doc.sts) {
                const existingSts = await RegistrationDoc.findOne({
                    where: { 
                        sts,
                        registrationNumber: { [Op.ne]: regNumber }
                    },
                    transaction
                });
                if (existingSts) {
                    throw ApiError.conflict('STS number already in use');
                }
            }

            await doc.update({
                address,
                pts,
                sts,
                registrationDate: new Date(registrationDate).toISOString().split('T')[0],
                documentOwner
            }, {
                transaction,
                fields: ['address', 'pts', 'sts', 'registrationDate', 'documentOwner']
            });

            await transaction.commit();

            const updatedDoc = await RegistrationDoc.findByPk(regNumber, {
                include: [{
                    model: Owner,
                    as: 'owner'
                }]
            });

            res.json(updatedDoc);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }

    async patchRegDoc(req, res, next) {
        const transaction = await sequelize.transaction();
        try {
            const { regNumber } = req.params;
            const { error, value } = regDocPatchSchema.validate(req.body);
            
            if (error) {
                throw ApiError.badRequest(error.details[0].message);
            }

            const doc = await RegistrationDoc.findByPk(regNumber, { transaction });
            if (!doc) {
                throw ApiError.notFound('Registration document not found');
            }

            if (value.documentOwner) {
                let ownerExists = false;
                if (value.documentOwner.length === 11) { 
                    const naturalPerson = await NaturalPerson.findOne({
                        where: { 
                            passportData: value.documentOwner,
                            address: value.address || doc.address
                        },
                        transaction
                    });
                    if (!naturalPerson) {
                        throw ApiError.badRequest('Natural person with this passport and address not found');
                    }
                    ownerExists = true;
                } else { 
                    const legalEntity = await LegalEntity.findOne({
                        where: { 
                            taxNumber: value.documentOwner,
                            address: value.address || doc.address
                        },
                        transaction
                    });
                    if (!legalEntity) {
                        throw ApiError.badRequest('Legal entity with this tax number and address not found');
                    }
                    ownerExists = true;
                }
            }

            if (value.address) {
                let owner = await Owner.findOne({
                    where: { address: value.address },
                    transaction
                });

                if (!owner) {                   
                    if (value.documentOwner) {
                        const ownerExists = value.documentOwner.length === 11
                            ? await NaturalPerson.findOne({
                                where: { 
                                    passportData: value.documentOwner,
                                    address: value.address
                                },
                                transaction
                            })
                            : await LegalEntity.findOne({
                                where: { 
                                    taxNumber: value.documentOwner,
                                    address: value.address
                                },
                                transaction
                            });

                        if (!ownerExists) {
                            throw ApiError.badRequest('Address not found in any owner records');
                        }
                    } else {
                        const ownerExists = doc.documentOwner.length === 11
                            ? await NaturalPerson.findOne({
                                where: { 
                                    passportData: doc.documentOwner,
                                    address: value.address
                                },
                                transaction
                            })
                            : await LegalEntity.findOne({
                                where: { 
                                    taxNumber: doc.documentOwner,
                                    address: value.address
                                },
                                transaction
                            });

                        if (!ownerExists) {
                            throw ApiError.badRequest('Address not found in any owner records');
                        }
                    }
                    owner = await Owner.create({ address: value.address }, { transaction });
                }
            }

            if (value.pts && value.pts !== doc.pts) {
                const existingPts = await RegistrationDoc.findOne({
                    where: { 
                        pts: value.pts,
                        registrationNumber: { [Op.ne]: regNumber }
                    },
                    transaction
                });
                if (existingPts) {
                    throw ApiError.conflict('PTS number already in use');
                }
            }

            if (value.sts && value.sts !== doc.sts) {
                const existingSts = await RegistrationDoc.findOne({
                    where: { 
                        sts: value.sts,
                        registrationNumber: { [Op.ne]: regNumber }
                    },
                    transaction
                });
                if (existingSts) {
                    throw ApiError.conflict('STS number already in use');
                }
            }

            if (value.registrationDate) {
                value.registrationDate = new Date(value.registrationDate).toISOString().split('T')[0];
            }

            await doc.update(value, {
                transaction,
                fields: ['address', 'pts', 'sts', 'registrationDate', 'documentOwner']
            });

            await transaction.commit();

            const updatedDoc = await RegistrationDoc.findByPk(regNumber, {
                include: [{
                    model: Owner,
                    as: 'owner'
                }]
            });

            res.json(updatedDoc);
        } catch (e) {
            await transaction.rollback();
            console.error('PATCH ERROR:', e);
            next(e);
        }
    }
}

module.exports = new RegDocCrudController();