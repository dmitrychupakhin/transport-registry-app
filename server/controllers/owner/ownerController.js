const { RegistrationOp, RegDepartment } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');

class OwnerController {
    /**
     * Get user's registration operations
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getMyRegOps(req, res, next) {
        try {
            const { error } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(20),
                page: Joi.number().integer().min(1).default(1)
            }).validate(req.query);

            if (error) throw ApiError.badRequest(error.details[0].message);

            const { limit, page } = req.query;
            const offset = (page - 1) * limit;
            const userId = req.user.id;

            const { count, rows } = await RegistrationOp.findAndCountAll({
                where: { requestedBy: userId },
                limit,
                offset,
                include: [{
                    model: RegDepartment,
                    attributes: ['name', 'address']
                }],
                order: [['createdAt', 'DESC']]
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
     * Get registration departments
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getRegDepart(req, res, next) {
        try {
            const { error } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(20),
                page: Joi.number().integer().min(1).default(1),
                search: Joi.string().optional()
            }).validate(req.query);

            if (error) throw ApiError.badRequest(error.details[0].message);

            const { limit, page, search } = req.query;
            const offset = (page - 1) * limit;

            const where = {};
            if (search) {
                where[Op.or] = [
                    { name: { [Op.like]: `%${search}%` }},
                    { address: { [Op.like]: `%${search}%` }}
                ];
            }

            const { count, rows } = await RegDepartment.findAndCountAll({
                where,
                limit,
                offset,
                order: [['name', 'ASC']],
                attributes: ['id', 'name', 'address', 'workingHours']
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
}

module.exports = new OwnerController();