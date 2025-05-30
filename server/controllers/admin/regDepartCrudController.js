const { RegistrationDepart, Employee } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');
const { regDepartSchema, regDepartPutSchema, regDepartPatchSchema } = require('../../validations/regDepartShema');

class RegDepartCrudController {
    
    async getAllRegDepart(req, res, next) {
        try {
            const schema = Joi.object({
                limit: Joi.number().integer().min(1).max(50).default(15),
                page: Joi.number().integer().min(1).default(1),
                search: Joi.string().optional(),
                sortOrder: Joi.string().valid('asc', 'desc').insensitive().default('asc')
            });

            const rawQuery = { ...req.query };

            if (rawQuery.sortOrder !== undefined && rawQuery.sortOrder !== null) {
                rawQuery.sortOrder = String(rawQuery.sortOrder).toLowerCase().trim();
            }

            const { error, value } = schema.validate(rawQuery);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const { limit, page, search, sortOrder } = value;
            const offset = (page - 1) * limit;

            const where = {};
            if (search) {
                where[Op.or] = [
                    { unitCode: { [Op.like]: `%${search}%` }},
                    { departmentName: { [Op.like]: `%${search}%` }},
                    { address: { [Op.like]: `%${search}%` }}
                ];
            }

            const { count, rows } = await RegistrationDepart.findAndCountAll({
                where,
                limit,
                offset,
                order: [['departmentName', sortOrder.toUpperCase()]]
            });

            res.json({
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: page,
                data: rows
            });
        } catch (e) {
            console.error("GET ALL ERROR:", e);
            next(e);
        }
    }

    async getRegDepartByField(req, res, next) {
        try {
            const schema = Joi.object({
                unitCode: Joi.string().length(6),
                departmentName: Joi.string().min(8).max(128),
                address: Joi.string().min(8).max(255)
            }).xor('unitCode', 'departmentName', 'address');

            const { error, value } = schema.validate(req.query);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const department = await RegistrationDepart.findOne({
                where: value
            });

            if (!department) {
                throw ApiError.notFound('Department not found');
            }

            res.json(department);
        } catch (e) {
            console.error('GET DEPARTMENT BY FIELD ERROR:', e);
            next(e);
        }
    }

    async createRegDepart(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { error } = regDepartSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const { unitCode, departmentName, address } = req.body;

            const existing = await RegistrationDepart.findOne({
                where: {
                    [Op.or]: [
                        { unitCode },
                        { departmentName },
                        { address }
                    ]
                },
                transaction
            });

            if (existing) {
                throw ApiError.conflict('Department with this unit code, name, or address already exists');
            }

            const department = await RegistrationDepart.create(req.body, {
                transaction
            });

            await transaction.commit();
            res.status(201).json(department);
        } catch (e) {
            await transaction.rollback();
            console.error("CREATE ERROR:", e);
            next(e);
        }
    }

    async updateRegDepart(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { unitCode } = req.params;

            const { error, value } = regDepartPutSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const department = await RegistrationDepart.findByPk(unitCode, { transaction });
            if (!department) {
                throw ApiError.notFound('Department not found');
            }

            const { departmentName, address } = value;

            if (departmentName && departmentName !== department.departmentName) {
                const existing = await RegistrationDepart.findOne({
                    where: { departmentName },
                    transaction
                });
                if (existing) {
                    throw ApiError.conflict('Department with this name already exists');
                }
            }

            if (address && address !== department.address) {
                const existing = await RegistrationDepart.findOne({
                    where: { address },
                    transaction
                });
                if (existing) {
                    throw ApiError.conflict('Department with this address already exists');
                }
            }

            await department.update(value, { transaction });

            await transaction.commit();
            res.json(department);
        } catch (e) {
            await transaction.rollback();
            console.error('UPDATE ERROR:', e);
            next(e);
        }
    }

    async patchRegDepart(req, res, next) {
        const transaction = await sequelize.transaction();

        try {
            const { unitCode } = req.params;

            const { error, value } = regDepartPatchSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            if (Object.keys(value).length === 0) {
                throw ApiError.badRequest('No data provided to update');
            }

            const department = await RegistrationDepart.findByPk(unitCode, { transaction });
            if (!department) throw ApiError.notFound('Department not found');

            if (value.departmentName && value.departmentName !== department.departmentName) {
                const existing = await RegistrationDepart.findOne({
                    where: { departmentName: value.departmentName },
                    transaction
                });
                if (existing) throw ApiError.conflict('Department name already exists');
            }

            if (value.address && value.address !== department.address) {
                const existing = await RegistrationDepart.findOne({
                    where: { address: value.address },
                    transaction
                });
                if (existing) throw ApiError.conflict('Department address already exists');
            }

            await department.update(value, { transaction });
            await transaction.commit();
            res.json(department);
        } catch (e) {
            await transaction.rollback();
            console.error('PATCH ERROR:', e);
            next(e);
        }
    }

    async deleteRegDepart(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { unitCode } = req.params;

            const department = await RegistrationDepart.findByPk(unitCode, { transaction });
            if (!department) {
                throw ApiError.notFound('Department not found');
            }

            const hasEmployees = await Employee.findOne({
                where: { unitCode: department.unitCode },
                transaction
            });

            if (hasEmployees) {
                throw ApiError.badRequest('Cannot delete department: employees are still assigned');
            }

            await department.destroy({ transaction });

            await transaction.commit();
            res.status(204).send();
        } catch (e) {
            await transaction.rollback();
            console.error('DELETE ERROR:', e);
            next(e);
        }
    }
}

module.exports = new RegDepartCrudController();