const { User } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');
const bcrypt = require('bcrypt');

const userSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(50).required(),
    role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'OWNER').required(),
    passportData: Joi.string().optional().allow(null),
    taxNumber: Joi.string().optional().allow(null),
    badgeNumber: Joi.string().optional().allow(null)
});

const userPatchSchema = Joi.object({
    email: Joi.string().email().optional(),
    password: Joi.string().min(8).max(50).optional(),
    role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'OWNER').optional(),
    passportData: Joi.string().optional().allow(null),
    taxNumber: Joi.string().optional().allow(null),
    badgeNumber: Joi.string().optional().allow(null)
}).min(1);

class UserCrudController {

    async getAllUser(req, res, next) {
        try {
            const { error, value } = Joi.object({
                limit: Joi.number().integer().min(1).max(50).default(15),
                page: Joi.number().integer().min(1).default(1),
                search: Joi.string().optional(),
                role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'OWNER').optional()
            }).validate(req.query);

            if (error) throw ApiError.badRequest(error.details[0].message);

            const { limit, page, search, role } = value;
            const offset = (page - 1) * limit;

            const where = {};
            if (search) {
                where.email = { [Op.like]: `%${search}%` };
            }
            if (role) {
                where.role = role;
            }

            const { count, rows } = await User.findAndCountAll({
                where,
                limit,
                offset,
                order: [['email', 'ASC']],
                attributes: { exclude: ['password'] }
            });

            res.json({
                total: count,
                pages: Math.ceil(count / limit),
                currentPage: page,
                data: rows
            });
        } catch (e) {
            console.error("GET ALL ERROR:", e);
            next(ApiError.internal(e.message));
        }
    }

    async getUserByField(req, res, next) {
        try {
            const schema = Joi.object({
                email: Joi.string().email(),
                passportData: Joi.string(),
                taxNumber: Joi.string(),
                badgeNumber: Joi.string()
            }).xor('email', 'passportData', 'taxNumber', 'badgeNumber');

            const { error, value } = schema.validate(req.query);
            if (error) {
                throw ApiError.badRequest(error.details[0].message);
            }

            const user = await User.findOne({
                where: value,
                attributes: { exclude: ['password'] }
            });

            if (!user) {
                throw ApiError.notFound('User not found');
            }

            res.json(user);
        } catch (e) {
            console.error("GET BY FIELD ERROR:", e);
            next(ApiError.internal(e.message));
        }
    }

    async createUser(req, res, next) {
        const transaction = await sequelize.transaction();
        const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;
        
        try {
            const { error } = userSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const { email, password, passportData, taxNumber, badgeNumber } = req.body;

            const existingEmail = await User.findOne({ where: { email }, transaction });
            if (existingEmail) throw ApiError.conflict('User with this email already exists');

            if (passportData) {
                const existingPassport = await User.findOne({ where: { passportData }, transaction });
                if (existingPassport) throw ApiError.conflict('User with this passport data already exists');
            }

            if (taxNumber) {
                const existingTax = await User.findOne({ where: { taxNumber }, transaction });
                if (existingTax) throw ApiError.conflict('User with this tax number already exists');
            }

            if (badgeNumber) {
                const existingBadge = await User.findOne({ where: { badgeNumber }, transaction });
                if (existingBadge) throw ApiError.conflict('User with this badge number already exists');
            }

            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const user = await User.create({
                ...req.body,
                password: hashedPassword
            }, { transaction });

            const { password: _, ...userWithoutPassword } = user.toJSON();

            await transaction.commit();
            res.status(201).json(userWithoutPassword);
        } catch (e) {
            await transaction.rollback();
            console.error("CREATE ERROR:", e);
            next(ApiError.internal(e.message)); 
        }
    }

    async patchUser(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;
            if (!id) {
                throw ApiError.badRequest('User ID is required');
            }

            const { error, value  } = userPatchSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const user = await User.findByPk(id, { transaction });
            if (!user) {
                throw ApiError.notFound('User not found');
            }

            const { email, passportData, taxNumber, badgeNumber, password } = value;

            if (email && email !== user.email) {
                const existing = await User.findOne({ where: { email }, transaction });
                if (existing) throw ApiError.conflict('Email already in use');
            }

            if (passportData !== undefined && passportData !== user.passportData) {
                const existing = await User.findOne({ where: { passportData }, transaction });
                if (existing) throw ApiError.conflict('Passport data already used by another user');
            }

            if (taxNumber !== undefined && taxNumber !== user.taxNumber) {
                const existing = await User.findOne({ where: { taxNumber }, transaction });
                if (existing) throw ApiError.conflict('Tax number already used by another user');
            }

            if (badgeNumber !== undefined && badgeNumber !== user.badgeNumber) {
                const existing = await User.findOne({ where: { badgeNumber }, transaction });
                if (existing) throw ApiError.conflict('Badge number already used by another user');
            }

            if (password) {
                const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;
                value.password = await bcrypt.hash(password, SALT_ROUNDS);
            }

            await user.update(value, { transaction });

            const { password: _, ...userWithoutPassword } = user.toJSON();

            await transaction.commit();
            res.json(userWithoutPassword);
        } catch (e) {
            await transaction.rollback();
            console.error('PATCH ERROR:', e);
            next(ApiError.internal(e.message));
        }
    }

    async deleteUser(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;
            if (!id) {
                throw ApiError.badRequest('User ID is required');
            }

            const user = await User.findByPk(id, { transaction });
            if (!user) {
                throw ApiError.notFound('User not found');
            }

            await user.destroy({ transaction });

            await transaction.commit();
            res.status(204).send();
        } catch (e) {
            await transaction.rollback();
            console.error('DELETE ERROR:', e);
            next(ApiError.internal(e.message));
        }
    }
}

module.exports = new UserCrudController();