const request = require('supertest');
const app = require('../../app');

describe('Employee API', () => {
  const department = {
    unitCode: '123456',
    departmentName: 'Тестовый отдел',
    address: 'г. Тестовск, ул. Проверочная, 1'
  };

  const employeeData = {
    badgeNumber: '12-3456',
    unitCode: department.unitCode,
    lastName: 'Иванов',
    firstName: 'Иван',
    patronymic: 'Иванович',
    rank: 'Капитан'
  };

  const updatedData = {
    unitCode: department.unitCode,
    lastName: 'Петров',
    firstName: 'Пётр',
    patronymic: 'Петрович',
    rank: 'Подполковник'
  };

  beforeAll(async () => {
    await request(app).post('/api/admin/reg-depart').send(department);
  });

  afterAll(async () => {    
    await request(app).delete(`/api/admin/employees/${employeeData.badgeNumber}`).catch(() => {});    
    await request(app).delete(`/api/admin/reg-depart/${department.unitCode}`).catch(() => {});
  });

  describe('Create & Read', () => {
    // Создание сотрудника
    test('should create an employee', async () => {
      const res = await request(app).post('/api/admin/employees').send(employeeData);
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('badgeNumber', employeeData.badgeNumber);
    });

    // Получение списка сотрудников
    test('should return list of employees', async () => {
      const res = await request(app).get('/api/admin/employees');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    // Поиск сотрудника по номеру значка
    test('should find employee by badgeNumber', async () => {
      const res = await request(app)
        .get('/api/admin/employees/search')
        .query({ badgeNumber: employeeData.badgeNumber });
      expect(res.statusCode).toBe(200);
      expect(res.body.badgeNumber).toBe(employeeData.badgeNumber);
    });
  });

  describe('Update', () => {
    // Полное обновление данных сотрудника (PUT)
    test('should update all fields (PUT)', async () => {
      const res = await request(app)
        .put(`/api/admin/employees/${employeeData.badgeNumber}`)
        .send(updatedData);
      expect(res.statusCode).toBe(200);
      expect(res.body.lastName).toBe(updatedData.lastName);
    });

    // Частичное обновление данных сотрудника - только звание (PATCH)
    test('should update rank (PATCH)', async () => {
      const res = await request(app)
        .patch(`/api/admin/employees/${employeeData.badgeNumber}`)
        .send({ rank: 'Майор' });
      expect(res.statusCode).toBe(200);
      expect(res.body.rank).toBe('Майор');
    });
  });

  describe('Delete', () => {
    // Удаление существующего сотрудника
    test('should delete employee', async () => {
      const res = await request(app).delete(`/api/admin/employees/${employeeData.badgeNumber}`);
      expect(res.statusCode).toBe(204);
    });

    // Попытка удаления несуществующего сотрудника — должно вернуть 404
    test('should return 404 after delete', async () => {
      const res = await request(app)
        .get('/api/admin/employees/search')
        .query({ badgeNumber: employeeData.badgeNumber });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Filters & Pagination', () => {
    beforeAll(async () => {
      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/admin/employees').send({
          badgeNumber: `12-34${i}${i}`,
          unitCode: department.unitCode,
          lastName: `Тестов${i}`,
          firstName: `Имя${i}`,
          patronymic: `Отчество${i}`,
          rank: i % 2 === 0 ? 'Майор' : 'Лейтенант'
        });
      }
    });

    afterAll(async () => {
      for (let i = 0; i < 5; i++) {
        await request(app).delete(`/api/admin/employees/12-34${i}${i}`).catch(() => {});
      }
    });

    // Сортировка сотрудников по званию
    test('should filter by rank', async () => {
      const res = await request(app).get('/api/admin/employees').query({ rank: 'Майор' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.every(e => e.rank.includes('Майор'))).toBe(true);
    });

    // Пагинация - получение второй страницы по 2 записи
    test('should paginate results', async () => {
      const res = await request(app).get('/api/admin/employees').query({ limit: 2, page: 2 });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.currentPage).toBe(2);
    });

    // Сортировка по фамилии в порядке убывания
    test('should sort by lastName desc', async () => {
      const res = await request(app)
        .get('/api/admin/employees')
        .query({ sortField: 'lastName', sortOrder: 'desc' });

      expect(res.statusCode).toBe(200);
      const names = res.body.data.map(e => e.lastName);
      const sorted = [...names].sort().reverse();
      expect(names).toEqual(sorted);
    });
  });

  describe('Validation & Errors', () => {
    // Некорректный формат номера значка
    test('should reject invalid badgeNumber', async () => {
      const res = await request(app).post('/api/admin/employees').send({
        ...employeeData,
        badgeNumber: '123456'
      });
      expect(res.statusCode).toBe(400);
    });

    // Дублирование номера значка - должен вернуть 409
    test('should not allow duplicate badgeNumber', async () => {
      await request(app).post('/api/admin/employees').send(employeeData); 
      const res = await request(app).post('/api/admin/employees').send(employeeData); 
      expect(res.statusCode).toBe(409);
    });

    // Обновление несуществующего сотрудника - должен вернуть 404
    test('should return 404 when updating non-existent employee', async () => {
      const res = await request(app)
        .put('/api/admin/employees/00-0000')
        .send(updatedData);
      expect(res.statusCode).toBe(404);
    });
  });
});
