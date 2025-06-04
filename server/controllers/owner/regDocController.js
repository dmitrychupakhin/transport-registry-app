const { RegistrationDoc, RegistrationOp, TransportVehicle } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');

class RegDocController {
    async getAllRegDoc(req, res, next) {
        try {
            const { error } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(10),
                page: Joi.number().integer().min(1).default(1)
            }).validate(req.query);

            if (error) throw ApiError.badRequest(error.details[0].message);
            const { limit, page } = req.query;
            const offset = (page - 1) * limit;

            const user = req.user;
            if (user.role !== 'OWNER') throw ApiError.forbidden('Only owners are allowed to view registration documents');

            const documentOwner = user.passportData || user.taxNumber;
            if (!documentOwner) throw ApiError.forbidden('Unable to determine the document owner');

            const { count, rows } = await RegistrationDoc.findAndCountAll({
                where: { documentOwner },
                include: [{
                    model: RegistrationOp,
                    attributes: ['vin', 'operationDate', 'operationType'],
                    include: [{
                        model: TransportVehicle,
                        attributes: ['makeAndModel', 'releaseYear']
                    }]
                }],
                limit,
                offset,
                order: [['registrationDate', 'DESC']]
            });

            res.json({
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: +page,
                data: rows
            });
        } catch (e) {
            console.error("GET ALL REGDOC ERROR:", e);
            next(ApiError.internal(e.message));
        }
    }

    async getRegDocByRegNumber(req, res, next) {
        try {
            const { regNumber } = req.params;
            const user = req.user;

            if (user.role !== 'OWNER') throw ApiError.forbidden('Only owners are allowed to view registration documents');
            const documentOwner = user.passportData || user.taxNumber;
            if (!documentOwner) throw ApiError.forbidden('Unable to determine the document owner');

            const doc = await RegistrationDoc.findOne({
                where: {
                    registrationNumber: regNumber,
                    documentOwner
                },
                include: [{
                    model: RegistrationOp,
                    attributes: ['vin', 'operationDate', 'operationType'],
                    include: [{
                        model: TransportVehicle,
                        attributes: ['makeAndModel', 'releaseYear']
                    }]
                }]
            });

            if (!doc) throw ApiError.notFound('Registration document not found or access is denied');

            res.json(doc);
        } catch (e) {
            console.error('GET REGDOC BY NUMBER ERROR:', e);
            next(ApiError.internal(e.message));
        }
    }
}

module.exports = new RegDocController();