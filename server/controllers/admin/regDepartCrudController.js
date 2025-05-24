const { RegDepartment } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');

const regDepartSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    address: Joi.string().min(5).max(255).required(),
    unitCode: Joi.string().min(3).max(50).required(),
    workingHours: Joi.string().min(5).max(100).required(),
    phoneNumber: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
    email: Joi.string().email().required()
});

class RegDepartCrudController {
    /**
     * Get all registration departments with filtering and pagination
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getAllRegDepart(req, res, next) {
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
                    { address: { [Op.like]: `%${search}%` }},
                    { unitCode: { [Op.like]: `%${search}%` }}
                ];
            }

            const { count, rows } = await RegDepartment.findAndCountAll({
                where,
                limit,
                offset,
                order: [['name', 'ASC']]
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
     * Create new registration department
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async createRegDepart(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { error } = regDepartSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const { unitCode, email } = req.body;

            // Проверка на существование департамента с таким кодом
            const existingDepartment = await RegDepartment.findOne({
                where: { unitCode },
                transaction
            });

            if (existingDepartment) {
                throw ApiError.conflict('Department with this unit code already exists');
            }

            // Проверка на существование департамента с таким email
            const existingEmail = await RegDepartment.findOne({
                where: { email },
                transaction
            });

            if (existingEmail) {
                throw ApiError.conflict('Department with this email already exists');
            }

            const department = await RegDepartment.create(req.body, {
                transaction
            });

            await transaction.commit();
            res.status(201).json(department);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }

    /**
     * Update registration department
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async updateRegDepart(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;
            const { error } = regDepartSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const department = await RegDepartment.findByPk(id, { transaction });
            if (!department) {
                throw ApiError.notFound('Department not found');
            }

            // Проверка на уникальность кода подразделения
            if (req.body.unitCode && req.body.unitCode !== department.unitCode) {
                const existingDepartment = await RegDepartment.findOne({
                    where: { unitCode: req.body.unitCode },
                    transaction
                });

                if (existingDepartment) {
                    throw ApiError.conflict('Department with this unit code already exists');
                }
            }

            // Проверка на уникальность email
            if (req.body.email && req.body.email !== department.email) {
                const existingEmail = await RegDepartment.findOne({
                    where: { email: req.body.email },
                    transaction
                });

                if (existingEmail) {
                    throw ApiError.conflict('Department with this email already exists');
                }
            }

            await department.update(req.body, {
                transaction
            });

            await transaction.commit();
            res.json(department);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }

    /**
     * Delete registration department
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async deleteRegDepart(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;

            const department = await RegDepartment.findByPk(id, { transaction });
            if (!department) {
                throw ApiError.notFound('Department not found');
            }

            await department.destroy({ transaction });

            await transaction.commit();
            res.status(204).send();
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }
}

module.exports = new RegDepartCrudController();