const errorMessages = {
  'User with this email already exists': 'Пользователь с таким email уже существует',
  'User not found': 'Пользователь не найден',
  'Invalid password': 'Неверный пароль',
  'Email and password are required': 'Email и пароль обязательны',

  'Employee not found': 'Сотрудник не найден',
  'Employee already registered': 'Сотрудник уже зарегистрирован',

  'Natural person not found': 'Физическое лицо не найдено',
  'Legal entity not found': 'Юридическое лицо не найдено',
  'Natural person with this passport already exists': 'Физическое лицо с таким паспортом уже существует',
  'Legal entity with this tax number already exists': 'Юридическое лицо с таким ИНН уже существует',

  'Invalid passport format (should be "XXXX XXXXXX")': 'Неверный формат паспорта (должен быть "XXXX XXXXXX")',
  'Invalid tax number format (should be 10 digits)': 'Неверный формат ИНН (должен быть из 10 цифр)',
};

function translateError(message) {
  return errorMessages[message] || message;
}

module.exports = { translateError };
