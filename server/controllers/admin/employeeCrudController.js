const { Employee } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');

const employeeSchema = Joi.object({
    badgeNumber: Joi.string().pattern(/^\d{2}-\d{4}$/).required(),
    unitCode: Joi.string().length(6).required(),
    lastName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    firstName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    patronymic: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    rank: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required()
});

const employeePutSchema = Joi.object({
    unitCode: Joi.string().length(6).required(),
    lastName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    firstName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    patronymic: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required(),
    rank: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50).required()
});

const employeePatchSchema = Joi.object({
    unitCode: Joi.string().length(6),
    lastName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50),
    firstName: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50),
    patronymic: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50),
    rank: Joi.string().pattern(/^[А-Яа-яЁё\s\-]+$/).min(2).max(50)
}).min(1);

class EmployeeCrudController {
    
    async getAllEmployees(req, res, next) {
        try {
            const schema = Joi.object({
            limit: Joi.number().integer().min(1).max(50).default(15),
            page: Joi.number().integer().min(1).default(1),

            badgeNumber: Joi.string().optional(),
            unitCode: Joi.string().length(6).optional(),
            lastName: Joi.string().optional(),
            firstName: Joi.string().optional(),
            patronymic: Joi.string().optional(),
            rank: Joi.string().optional(),

            sortField: Joi.string()
                .valid('badgeNumber', 'unitCode', 'lastName', 'firstName', 'patronymic', 'rank')
                .default('lastName'),

            sortOrder: Joi.string().valid('asc', 'desc').insensitive().default('asc')
            });

            const rawQuery = { ...req.query };

            if (rawQuery.sortOrder !== undefined && rawQuery.sortOrder !== null) {
                rawQuery.sortOrder = String(rawQuery.sortOrder).toLowerCase().trim();
            }

            const { error, value } = schema.validate(rawQuery);
            if (error) {
            throw ApiError.badRequest(error.details[0].message);
            }

            const {
                limit,
                page,
                badgeNumber,
                unitCode,
                lastName,
                firstName,
                patronymic,
                rank,
                sortField,
                sortOrder
            } = value;

            const offset = (page - 1) * limit;

            const where = {};
            if (badgeNumber) where.badgeNumber = { [Op.like]: `%${badgeNumber}%` };
            if (unitCode) where.unitCode = unitCode;
            if (lastName) where.lastName = { [Op.like]: `%${lastName}%` };
            if (firstName) where.firstName = { [Op.like]: `%${firstName}%` };
            if (patronymic) where.patronymic = { [Op.like]: `%${patronymic}%` };
            if (rank) where.rank = { [Op.like]: `%${rank}%` };

            const { count, rows } = await Employee.findAndCountAll({
                where,
                limit,
                offset,
                order: [[sortField, sortOrder.toUpperCase()]]
            });

            res.json({
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: page,
                data: rows
            });
        } catch (e) {
            console.error('GET EMPLOYEES ERROR:', e);
            next(e);
        }
    }

    async getEmployeeByField(req, res, next) {
        try {
            const schema = Joi.object({
                badgeNumber: Joi.string(),
                lastName: Joi.string(),
                unitCode: Joi.string().length(6)
            }).xor('badgeNumber', 'lastName', 'unitCode');

            const { error, value } = schema.validate(req.query);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const employee = await Employee.findOne({
                where: value
            });

            if (!employee) {
                throw ApiError.notFound('Employee not found');
            }

            res.json(employee);
        } catch (e) {
            console.error('GET BY FIELD ERROR:', e);
            next(e);
        }
    }

    async createEmployee(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { error } = employeeSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const { badgeNumber } = req.body;

            const existingEmployee = await Employee.findOne({
                where: { badgeNumber },
                transaction
            });

            if (existingEmployee) {
                throw ApiError.conflict('Employee with this badge number already exists');
            }

            const employee = await Employee.create(req.body, { transaction });

            await transaction.commit();
            res.status(201).json(employee);
        } catch (e) {
            await transaction.rollback();
            console.error('CREATE EMPLOYEE ERROR:', e);
            next(e);
        }
    }

    async updateEmployee(req, res, next) {
        const transaction = await sequelize.transaction();

        try {
            const { badgeNumber } = req.params;

            const { error, value } = employeePutSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const employee = await Employee.findByPk(badgeNumber, { transaction });
            if (!employee) {
                throw ApiError.notFound('Employee not found');
            }

            await employee.update(value, { transaction });

            await transaction.commit();
            res.json(employee);
        } catch (e) {
            await transaction.rollback();
            console.error('UPDATE ERROR:', e);
            next(e);
        }
    }

    async patchEmployee(req, res, next) {
    const transaction = await sequelize.transaction();

        try {
            const { badgeNumber } = req.params;

            const { error, value } = employeePatchSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            if ('badgeNumber' in value) {
                throw ApiError.badRequest('Badge number cannot be updated');
            }

            const employee = await Employee.findByPk(badgeNumber, { transaction });
            if (!employee) {
                throw ApiError.notFound('Employee not found');
            }

            await employee.update(value, { transaction });

            await transaction.commit();
            res.json(employee);
        } catch (e) {
            await transaction.rollback();
            console.error('PATCH ERROR:', e);
            next(e);
        }
    }

    async deleteEmployee(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { badgeNumber } = req.params;

            const employee = await Employee.findByPk(badgeNumber, { transaction });
            if (!employee) {
                throw ApiError.notFound('Employee not found');
            }

            await employee.destroy({ transaction });

            await transaction.commit();
            res.status(204).send();
        } catch (e) {
            await transaction.rollback();
            console.error('DELETE ERROR:', e);
            next(e);
        }
    }
}

module.exports = new EmployeeCrudController();