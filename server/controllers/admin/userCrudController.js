const { User } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');
const bcrypt = require('bcrypt');

const userSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(50).required(),
    role: Joi.string().valid('user', 'admin').required(),
    isActive: Joi.boolean().required()
});

class UserCrudController {
    /**
     * Get all users with filtering and pagination
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getAllUser(req, res, next) {
        try {
            const { error } = Joi.object({
                limit: Joi.number().integer().min(1).max(100).default(20),
                page: Joi.number().integer().min(1).default(1),
                search: Joi.string().optional(),
                role: Joi.string().valid('user', 'admin').optional()
            }).validate(req.query);

            if (error) throw ApiError.badRequest(error.details[0].message);

            const { limit, page, search, role } = req.query;
            const offset = (page - 1) * limit;

            const where = {};
            if (search) {
                where.email = { [Op.like]: `%${search}%` };
            }
            if (role) where.role = role;

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
                currentPage: +page,
                data: rows
            });
        } catch (e) {
            next(ApiError.internal(e.message));
        }
    }

    /**
     * Create new user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async createUser(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { error } = userSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const { email, password } = req.body;

            // Проверка на существование пользователя с таким email
            const existingUser = await User.findOne({
                where: { email },
                transaction
            });

            if (existingUser) {
                throw ApiError.conflict('User with this email already exists');
            }

            // Хеширование пароля
            const hashedPassword = await bcrypt.hash(password, 5);

            const user = await User.create({
                ...req.body,
                password: hashedPassword
            }, {
                transaction
            });

            const { password: _, ...userWithoutPassword } = user.toJSON();

            await transaction.commit();
            res.status(201).json(userWithoutPassword);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }

    /**
     * Update user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async updateUser(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;
            const { error } = userSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const user = await User.findByPk(id, { transaction });
            if (!user) {
                throw ApiError.notFound('User not found');
            }

            // Проверка на уникальность email
            if (req.body.email && req.body.email !== user.email) {
                const existingUser = await User.findOne({
                    where: { email: req.body.email },
                    transaction
                });

                if (existingUser) {
                    throw ApiError.conflict('User with this email already exists');
                }
            }

            // Хеширование нового пароля если он изменяется
            if (req.body.password) {
                req.body.password = await bcrypt.hash(req.body.password, 5);
            }

            await user.update(req.body, {
                transaction
            });

            const { password: _, ...userWithoutPassword } = user.toJSON();

            await transaction.commit();
            res.json(userWithoutPassword);
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }

    /**
     * Delete user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async deleteUser(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { id } = req.params;

            const user = await User.findByPk(id, { transaction });
            if (!user) {
                throw ApiError.notFound('User not found');
            }

            await user.destroy({ transaction });

            await transaction.commit();
            res.status(204).send();
        } catch (e) {
            await transaction.rollback();
            next(e);
        }
    }
}

module.exports = new UserCrudController();