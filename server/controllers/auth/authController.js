const { User, Employee, NaturalPerson, LegalEntity } = require('../../models/associations');
const ApiError = require('../../error/ApiError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const sequelize = require('../../db');

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) || 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const ownerRegistrationSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('OWNER').required(),
    passportData: Joi.string().when('isNaturalPerson', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.forbidden()
    }),
    taxNumber: Joi.string().when('isNaturalPerson', {
        is: false,
        then: Joi.required(),
        otherwise: Joi.forbidden()
    }),
    isNaturalPerson: Joi.boolean().required()
});

const employeeRegistrationSchema = Joi.object({
    badgeNumber: Joi.string().required()
});

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

class AuthController {
    async registerOwner(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { error, value } = ownerRegistrationSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const { email, password, role, passportData, taxNumber, isNaturalPerson } = value;

            const existingUser = await User.findOne({ 
                where: { email },
                transaction 
            });
            if (existingUser) {
                throw ApiError.conflict('User with this email already exists');
            }

            if (isNaturalPerson) {
                const person = await NaturalPerson.findOne({ 
                    where: { passportData },
                    transaction 
                });
                if (!person) {
                    throw ApiError.notFound('Natural person not found');
                }
            } else {
                const entity = await LegalEntity.findOne({ 
                    where: { taxNumber },
                    transaction 
                });
                if (!entity) {
                    throw ApiError.notFound('Legal entity not found');
                }
            }

            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const user = await User.create({
                email,
                password: hashedPassword,
                role,
                passportData: isNaturalPerson ? passportData : null,
                taxNumber: !isNaturalPerson ? taxNumber : null
            }, { transaction });

            await transaction.commit();

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            const { password: _, ...userWithoutPassword } = user.toJSON();

            res.status(201).json({
                user: userWithoutPassword,
                token
            });
        } catch (e) {
            await transaction.rollback();
            console.error('REGISTER OWNER ERROR:', e);
            next(e);
        }
    }

    async registerEmployee(req, res, next) {
        const transaction = await sequelize.transaction();
        
        try {
            const { error, value } = employeeRegistrationSchema.validate(req.body);
            if (error) throw ApiError.badRequest(error.details[0].message);

            const { badgeNumber } = value;

            const employee = await Employee.findOne({ 
                where: { badgeNumber },
                transaction 
            });
            if (!employee) {
                throw ApiError.notFound('Employee not found');
            }

            const existingUser = await User.findOne({ 
                where: { badgeNumber },
                transaction 
            });
            if (existingUser) {
                throw ApiError.conflict('Employee already registered');
            }

            const tempEmail = `${generateRandomString(10)}@employee.ru`;
            const tempPassword = generateRandomString(12);

            console.log(`Сгенерированный пароль для сотрудника: ${tempPassword}`);

            const hashedPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS);

            const user = await User.create({
                email: tempEmail,
                password: hashedPassword,
                role: 'EMPLOYEE',
                badgeNumber
            }, { transaction });

            await transaction.commit();

            res.status(201).json({
                message: 'Employee registered successfully. Please contact your supervisor for login credentials.',
                badgeNumber
            });
        } catch (e) {
            await transaction.rollback();
            console.error('REGISTER EMPLOYEE ERROR:', e);
            next(e);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw ApiError.badRequest('Email and password are required');
            }

            const user = await User.findOne({ where: { email } });
            if (!user) {
                throw ApiError.notFound('User not found');
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                throw ApiError.unauthorized('Invalid password');
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            const { password: _, ...userWithoutPassword } = user.toJSON();

            res.json({
                user: userWithoutPassword,
                token
            });
        } catch (e) {
            console.error('LOGIN ERROR:', e);
            next(e);
        }
    }

    async check(req, res, next) {
        try {
            
            if (!req.user || !req.user.id) {
                console.error('No user data in request');
                throw ApiError.unauthorized('No user data in request');
            }

            const user = await User.findOne({ 
                where: { id: req.user.id },
                attributes: { exclude: ['password'] }
            });
            
            if (!user) {
                console.error('User not found in database');
                throw ApiError.notFound('User not found');
            }

            res.json({
                user,
                message: 'User is authorized'
            });
        } catch (e) {
            console.error('CHECK ERROR:', e);
            if (e instanceof ApiError) {
                next(e);
            } else {
                next(ApiError.internal('Unexpected error during authorization check'));
            }
        }
    }
}

module.exports = new AuthController(); 