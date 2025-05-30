const Joi = require('joi');

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

module.exports = {
    userSchema,
    userPatchSchema
};