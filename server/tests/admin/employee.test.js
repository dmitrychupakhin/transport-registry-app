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

    test('POST /api/admin/employees — should create an employee', async () => {
        const res = await request(app).post('/api/admin/employees').send(employeeData);
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('badgeNumber', employeeData.badgeNumber);
    });

    test('GET /api/admin/employees — should return list', async () => {
        const res = await request(app).get('/api/admin/employees');
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ badgeNumber: employeeData.badgeNumber })
        ])
        );
    });

    test('GET /api/admin/employees/search — should find by badgeNumber', async () => {
        const res = await request(app)
        .get('/api/admin/employees/search')
        .query({ badgeNumber: employeeData.badgeNumber });
        expect(res.statusCode).toBe(200);
        expect(res.body.badgeNumber).toBe(employeeData.badgeNumber);
    });

    test('PUT /api/admin/employees/:badgeNumber — should update all fields', async () => {
        const res = await request(app)
        .put(`/api/admin/employees/${employeeData.badgeNumber}`)
        .send(updatedData);
        expect(res.statusCode).toBe(200);
        expect(res.body.lastName).toBe(updatedData.lastName);
        expect(res.body.rank).toBe(updatedData.rank);
    });

    test('PATCH /api/admin/employees/:badgeNumber — should update rank', async () => {
        const res = await request(app)
        .patch(`/api/admin/employees/${employeeData.badgeNumber}`)
        .send({ rank: 'Майор' });
        expect(res.statusCode).toBe(200);
        expect(res.body.rank).toBe('Майор');
    });

    test('DELETE /api/admin/employees/:badgeNumber — should delete employee', async () => {
        const res = await request(app).delete(`/api/admin/employees/${employeeData.badgeNumber}`);
        expect(res.statusCode).toBe(204);
    });

    test('GET after delete — should return 404', async () => {
        const res = await request(app)
        .get('/api/admin/employees/search')
        .query({ badgeNumber: employeeData.badgeNumber });
        expect(res.statusCode).toBe(404);
    });
});
