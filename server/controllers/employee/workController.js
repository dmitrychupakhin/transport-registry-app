const { Work, RegistrationOp, Employee } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');

const workSchema = Joi.object({
    badgeNumber: Joi.string().pattern(/^[A-Z0-9]{5,10}$/).required(),
    operationId: Joi.number().integer().min(1).required(),
    purpose: Joi.string().min(5).max(255).required(),
    workDate: Joi.date().iso().required()
});

class WorkController {
    /**
     * Get all work records with filtering
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getAllWork(req, res, next) {
        try {
            const { error } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(20),
                page: Joi.number().integer().min(1).default(1),
                badgeNumber: Joi.string().pattern(/^[A-Z0-9]{5,10}$/).optional(),
                operationId: Joi.number().integer().min(1).optional(),
                startDate: Joi.date().iso().optional(),
                endDate: Joi.date().iso().optional()
            }).validate(req.query);

            if (error) throw ApiError.badRequest(error.details[0].message);

            const { limit, page, badgeNumber, operationId, startDate, endDate } = req.query;
            const offset = (page - 1) * limit;

            const where = {};
            if (badgeNumber) where.badgeNumber = badgeNumber;
            if (operationId) where.operationId = operationId;
            if (startDate && endDate) {
                where.workDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
            }

            const { count, rows } = await Work.findAndCountAll({
                where,
                limit,
                offset,
                include: [
                    {
                        model: RegistrationOp,
                        attributes: ['operationId', 'operationType', 'operationDate', 'vin'],
                        required: true
                    },
                    {
                        model: Employee,
                        attributes: ['badgeNumber', 'firstName', 'lastName'],
                        required: true
                    }
                ],
                order: [['workDate', 'DESC']],
                attributes: { exclude: ['createdAt', 'updatedAt'] }
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
     * Create new work record
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async createWork(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { error } = workSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const { badgeNumber, operationId, workDate } = req.body;

            // Проверка существования операции
            const operation = await RegistrationOp.findByPk(operationId, { transaction });
            if (!operation) {
                throw ApiError.badRequest('Operation does not exist');
            }

            // Проверка существования сотрудника
            const employee = await Employee.findOne({
                where: { badgeNumber },
                transaction
            });

            if (!employee) {
                throw ApiError.badRequest('Employee does not exist');
            }

            // Проверка на дубликат записи о работе
            const existingWork = await Work.findOne({
                where: { 
                    badgeNumber,
                    operationId,
                    workDate: {
                        [Op.between]: [
                            new Date(workDate).setHours(0, 0, 0, 0),
                            new Date(workDate).setHours(23, 59, 59, 999)
                        ]
                    }
                },
                transaction
            });

            if (existingWork) {
                throw ApiError.conflict('Work record already exists for this employee, operation and date');
            }

            // Проверка, что дата работы не в будущем
            if (new Date(workDate) > new Date()) {
                throw ApiError.badRequest('Work date cannot be in the future');
            }

            const newWork = await Work.create(req.body, {
                transaction,
                returning: true
            });

            await transaction.commit();
            res.status(201).json(newWork);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }

    /**
     * Update work record
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async updateWork(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;
            const { error } = workSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const work = await Work.findOne({ 
                where: { operationId: id },
                transaction
            });

            if (!work) {
                throw ApiError.notFound('Work record not found');
            }

            // Проверка существования операции
            const operation = await RegistrationOp.findByPk(req.body.operationId, { transaction });
            if (!operation) {
                throw ApiError.badRequest('Operation does not exist');
            }

            // Проверка существования сотрудника
            const employee = await Employee.findOne({
                where: { badgeNumber: req.body.badgeNumber },
                transaction
            });

            if (!employee) {
                throw ApiError.badRequest('Employee does not exist');
            }

            // Проверка на дубликат записи о работе
            const existingWork = await Work.findOne({
                where: { 
                    badgeNumber: req.body.badgeNumber,
                    operationId: req.body.operationId,
                    workDate: {
                        [Op.between]: [
                            new Date(req.body.workDate).setHours(0, 0, 0, 0),
                            new Date(req.body.workDate).setHours(23, 59, 59, 999)
                        ]
                    },
                    operationId: { [Op.ne]: id } // Исключаем текущую запись
                },
                transaction
            });

            if (existingWork) {
                throw ApiError.conflict('Work record already exists for this employee, operation and date');
            }

            // Проверка, что дата работы не в будущем
            if (new Date(req.body.workDate) > new Date()) {
                throw ApiError.badRequest('Work date cannot be in the future');
            }

            await work.update(req.body, {
                transaction,
                fields: ['badgeNumber', 'operationId', 'purpose', 'workDate']
            });

            await transaction.commit();
            res.json(work);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }
}

module.exports = new WorkController();