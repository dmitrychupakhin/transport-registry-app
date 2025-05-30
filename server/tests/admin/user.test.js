const request = require('supertest');
const app = require('../../app');

describe('User API', () => {
  let createdAdmin, createdOwnerNatural, createdOwnerLegal, createdEmployee;

  const testData = {
    naturalPerson: {
      isNaturalPerson: true,
      passportData: '1234 567890',
      address: 'г. Москва, ул. Пушкина, д. 44, кв. 77',
      lastName: 'Иван',
      firstName: 'Иванов',
      patronymic: 'Иванович'
    },
    legalEntity: {
      isNaturalPerson: false,
      taxNumber: '1234567890',
      address: 'г. Москва, ул. Депутатская, д. 1',
      companyName: 'Аренда ТС'
    },
    regDepart: {
      unitCode: '535654',
      departmentName: 'МРЭО-53 УГИБДД по г. Москве',
      address: 'г. Москва, Северный Округ, ст. 4'
    },
    employee: {
      badgeNumber: '68-6306',
      unitCode: '535654',
      lastName: 'Сергей',
      firstName: 'Сергеев',
      patronymic: 'Сергеевич',
      rank: 'Капитан'
    },
    adminUser: {
      email: 'admin_test@example.com',
      password: 'AdminPass123',
      role: 'ADMIN'
    },
    ownerNaturalUser: {
      email: 'owner_natural@example.com',
      password: 'OwnerPass123',
      role: 'OWNER',
      passportData: '1234 567890'
    },
    ownerLegalUser: {
      email: 'owner_legal@example.com',
      password: 'OwnerPass456',
      role: 'OWNER',
      taxNumber: '1234567890'
    },
    employeeUser: {
      role: 'EMPLOYEE',
      badgeNumber: '68-6306'
    }
  };

  beforeAll(async () => {
    await request(app).post('/api/auth/register/natural-person').send(testData.naturalPerson);
    await request(app).post('/api/auth/register/legal-entity').send(testData.legalEntity);
    await request(app).post('/api/admin/reg-depart').send(testData.regDepart);
    await request(app).post('/api/admin/employees').send(testData.employee);
  });

  afterAll(async () => {
    await request(app).delete(`/api/admin/users/${createdAdmin.id}`).catch(() => {});
    await request(app).delete(`/api/admin/users/${createdOwnerNatural.id}`).catch(() => {});
    await request(app).delete(`/api/admin/users/${createdOwnerLegal.id}`).catch(() => {});
    await request(app).delete(`/api/admin/users/${createdEmployee.id}`).catch(() => {});

    await request(app).delete(`/api/admin/employees/${testData.employee.badgeNumber}`).catch(() => {});
    await request(app).delete(`/api/admin/reg-depart/${testData.regDepart.unitCode}`).catch(() => {});
    
    await request(app).delete(`/api/auth/natural-persons/${testData.naturalPerson.passportData}`).catch(() => {});
    await request(app).delete(`/api/auth/legal-entities/${testData.legalEntity.taxNumber}`).catch(() => {});
  });

  describe('Создание и чтение', () => {
    // Создание админа
    test('должен создать пользователя с ролью ADMIN', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .send(testData.adminUser);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.role).toBe('ADMIN');
      createdAdmin = res.body;
    });

    // Создание владельца (физ. лицо)
    test('должен создать пользователя OWNER с NaturalPerson', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .send(testData.ownerNaturalUser);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.role).toBe('OWNER');
      expect(res.body.passportData).toBe(testData.naturalPerson.passportData);
      createdOwnerNatural = res.body;
    });

    // Создание владельца (юр. лицо)
    test('должен создать пользователя OWNER с LegalEntity', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .send(testData.ownerLegalUser);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.role).toBe('OWNER');
      expect(res.body.taxNumber).toBe(testData.legalEntity.taxNumber);
      createdOwnerLegal = res.body;
    });

    // Создание сотрудника
    test('должен создать пользователя EMPLOYEE', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .send(testData.employeeUser);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.role).toBe('EMPLOYEE');
      expect(res.body.badgeNumber).toBe(testData.employee.badgeNumber);
      createdEmployee = res.body;
    });

    // Получение списка пользователей
    test('должен получить список всех пользователей', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    // Поиск пользователя по email
    test('должен найти пользователя по email', async () => {
      const res = await request(app)
        .get('/api/admin/users/search')
        .query({ email: testData.adminUser.email });
      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe(testData.adminUser.email);
    });
  });

  describe('Обновление', () => {
    test('должен частично обновить данные пользователя', async () => {
      const updateData = {
        email: 'updated_admin@example.com'
      };
      const res = await request(app)
        .patch(`/api/admin/users/${createdAdmin.id}`)
        .send(updateData);
      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe(updateData.email);
    });
  });

  describe('Удаление', () => {
    test('должен удалить пользователя', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${createdAdmin.id}`);
      expect(res.statusCode).toBe(204);
    });

    test('должен вернуть 404 для удаленного пользователя', async () => {
      const res = await request(app)
        .get('/api/admin/users/search')
        .query({ email: 'updated_admin@example.com' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Валидация и ошибки', () => {
    test('не должен позволить создать пользователя с существующим email', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .send(testData.ownerNaturalUser);
      expect(res.statusCode).toBe(409);
    });

    test('должен вернуть 404 при обновлении несуществующего пользователя', async () => {
      const res = await request(app)
        .patch('/api/admin/users/999999')
        .send({ email: 'nonexistent@example.com' });
      expect(res.statusCode).toBe(404);
    });

    test('должен отклонить короткий пароль', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .send({
          ...testData.adminUser,
          email: 'shortpass@example.com',
          password: '123'
        });
      expect(res.statusCode).toBe(400);
    });

    test('должен отклонить неверную роль', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .send({
          ...testData.adminUser,
          email: 'invalidrole@example.com',
          role: 'INVALID_ROLE'
        });
      expect(res.statusCode).toBe(400);
    });
  });
});
