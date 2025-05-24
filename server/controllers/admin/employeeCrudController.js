const { Employee } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');

const employeeSchema = Joi.object({
    badgeNumber: Joi.string().pattern(/^[A-Z0-9]{5,10}$/).required(),
    unitCode: Joi.string().min(3).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    firstName: Joi.string().min(2).max(50).required(),
    patronymic: Joi.string().min(2).max(50).required(),
    rank: Joi.string().min(2).max(50).required()
});

class EmployeeCrudController {
    /**
     * Get all employees with filtering and pagination
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getAllEmployees(req, res, next) {
        try {
            const { error } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(20),
                page: Joi.number().integer().min(1).default(1),
                search: Joi.string().optional(),
                unitCode: Joi.string().optional()
            }).validate(req.query);

            if (error) throw ApiError.badRequest(error.details[0].message);

            const { limit, page, search, unitCode } = req.query;
            const offset = (page - 1) * limit;

            const where = {};
            if (search) {
                where[Op.or] = [
                    { lastName: { [Op.like]: `%${search}%` }},
                    { firstName: { [Op.like]: `%${search}%` }},
                    { badgeNumber: { [Op.like]: `%${search}%` }}
                ];
            }
            if (unitCode) where.unitCode = unitCode;

            const { count, rows } = await Employee.findAndCountAll({
                where,
                limit,
                offset,
                order: [['lastName', 'ASC']]
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
     * Create new employee
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async createEmployee(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { error } = employeeSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const { badgeNumber } = req.body;

            // Проверка на существование сотрудника с таким номером бейджа
            const existingEmployee = await Employee.findOne({
                where: { badgeNumber },
                transaction
            });

            if (existingEmployee) {
                throw ApiError.conflict('Employee with this badge number already exists');
            }

            const employee = await Employee.create(req.body, {
                transaction
            });

            await transaction.commit();
            res.status(201).json(employee);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }

    /**
     * Update employee
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async updateEmployee(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;
            const { error } = employeeSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const employee = await Employee.findByPk(id, { transaction });
            if (!employee) {
                throw ApiError.notFound('Employee not found');
            }

            // Проверка на уникальность номера бейджа если он изменяется
            if (req.body.badgeNumber && req.body.badgeNumber !== employee.badgeNumber) {
                const existingEmployee = await Employee.findOne({
                    where: { badgeNumber: req.body.badgeNumber },
                    transaction
                });

                if (existingEmployee) {
                    throw ApiError.conflict('Employee with this badge number already exists');
                }
            }

            await employee.update(req.body, {
                transaction
            });

            await transaction.commit();
            res.json(employee);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }

    /**
     * Delete employee
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async deleteEmployee(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;

            const employee = await Employee.findByPk(id, { transaction });
            if (!employee) {
                throw ApiError.notFound('Employee not found');
            }

            await employee.destroy({ transaction });

            await transaction.commit();
            res.status(204).send();
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }
}

module.exports = new EmployeeCrudController();