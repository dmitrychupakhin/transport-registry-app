const { User, Employee, NaturalPerson, LegalEntity } = require('../../models/associations');
const ApiError = require("../../error/ApiError");
const Joi = require('joi');
const { Op } = require('sequelize');
const sequelize = require('../../db');
const bcrypt = require('bcrypt');

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const userSchema = Joi.object({
    email: Joi.string().email().optional(),
    password: Joi.string().min(8).max(50).optional(),
    role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'OWNER').required(),
    passportData: Joi.string().pattern(/^\d{4} \d{6}$/).optional().allow(null)
        .messages({ 'string.pattern.base': 'passportData must match format "1234 567890"' }),
    taxNumber: Joi.string().pattern(/^\d{10}$/).optional().allow(null)
        .messages({ 'string.pattern.base': 'taxNumber must contain exactly 10 digits' }),
    badgeNumber: Joi.string().pattern(/^\d{2}-\d{4}$/).optional().allow(null)
        .messages({ 'string.pattern.base': 'badgeNumber must match format "12-3456"' })
}).custom((value, helpers) => {
  const { role, passportData, taxNumber, badgeNumber, email, password } = value;

  if (role === 'EMPLOYEE') {
    if (!badgeNumber) return helpers.error('any.invalid', { message: 'EMPLOYEE must provide badgeNumber' });
  }

  if (role === 'OWNER') {
    if (!passportData && !taxNumber) return helpers.error('any.invalid', { message: 'Provide either passportData or taxNumber' });
    if (passportData && taxNumber) return helpers.error('any.invalid', { message: 'Only one of passportData or taxNumber allowed' });
    if (!email || !password) return helpers.error('any.invalid', { message: 'OWNER must provide email and password' });
  }

  if (role === 'ADMIN') {
    if (!email || !password) return helpers.error('any.invalid', { message: 'ADMIN must provide email and password' });
    if (passportData || taxNumber || badgeNumber) {
      return helpers.error('any.invalid', { message: 'ADMIN should not provide identity fields' });
    }
  }

  return value;
});

const userPatchSchema = Joi.object({
    email: Joi.string().email().optional(),
    password: Joi.string().min(8).max(50).optional(),
    role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'OWNER').optional(),
    passportData: Joi.string().pattern(/^\d{4} \d{6}$/).optional().allow(null)
        .messages({ 'string.pattern.base': 'passportData must match format "1234 567890"' }),
    taxNumber: Joi.string().pattern(/^\d{10}$/).optional().allow(null)
        .messages({ 'string.pattern.base': 'taxNumber must contain exactly 10 digits' }),
    badgeNumber: Joi.string().pattern(/^\d{2}-\d{4}$/).optional().allow(null)
        .messages({ 'string.pattern.base': 'badgeNumber must match format "12-3456"' })
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
            next(e);
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
            next(e);
        }
    }

    async createUser(req, res, next) {
        const transaction = await sequelize.transaction();
        const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;
        
        try {
            const { error, value } = userSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.message);

            const { role, badgeNumber, passportData, taxNumber, email, password } = value;

            let finalEmail = email;
            let finalPassword = password;
            
            if (role === 'EMPLOYEE') {
                if (!badgeNumber) throw ApiError.badRequest('badgeNumber is required');

                const employee = await Employee.findOne({ where: { badgeNumber }, transaction });
                if (!employee) throw ApiError.notFound('Employee not found');

                const existingUser = await User.findOne({ where: { badgeNumber }, transaction });
                if (existingUser) throw ApiError.conflict('User for this employee already exists');

                finalEmail = `${generateRandomString(10)}@employee.ru`;
                finalPassword = generateRandomString(12); 

                console.log(`Сгенерированный пароль для сотрудника: ${finalPassword}`);
            }

            if (role === 'OWNER') {
                if (!passportData && !taxNumber) throw ApiError.badRequest('OWNER must provide either passportData or taxNumber');
                if (passportData && taxNumber) throw ApiError.badRequest('Provide only one of passportData or taxNumber');
                if (!email || !password) throw ApiError.badRequest('OWNER must provide email and password');

                if (passportData) {
                    const person = await NaturalPerson.findOne({ where: { passportData }, transaction });
                    if (!person) throw ApiError.notFound('NaturalPerson not found');
                }

                if (taxNumber) {
                    const entity = await LegalEntity.findOne({ where: { taxNumber }, transaction });
                    if (!entity) throw ApiError.notFound('LegalEntity not found');
                }
            }

            if (role === 'ADMIN') {
                if (!email || !password) throw ApiError.badRequest('ADMIN must provide email and password');
            }

            if (finalEmail) {
                const existingEmail = await User.findOne({ where: { email: finalEmail }, transaction });
                if (existingEmail) throw ApiError.conflict('User with this email already exists');
            }

            const hashedPassword = await bcrypt.hash(finalPassword, SALT_ROUNDS);

            const user = await User.create({
                email: finalEmail,
                password: hashedPassword,
                role,
                passportData: passportData || null,
                taxNumber: taxNumber || null,
                badgeNumber: badgeNumber || null
            }, { transaction });

            await transaction.commit();

            const { password: _, ...userWithoutPassword } = user.toJSON();

            res.status(201).json(userWithoutPassword);
        } catch (e) {
            await transaction.rollback();
            console.error("CREATE ERROR:", e);
            next(e);
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
            next(e);
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
            next(e);
        }
    }
}

module.exports = new UserCrudController();