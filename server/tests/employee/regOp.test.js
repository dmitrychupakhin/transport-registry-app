const request = require('supertest');
const app = require('../../app');

const testData = {
    naturalPerson: {
        isNaturalPerson: true,
        address: 'г. Москва, ул. Пушкина, д. 1',
        passportData: '1234 567890',
        lastName: 'Иванов',
        firstName: 'Иван',        
        patronymic: 'Иванович'        
    },
    vehicle: {
        vin: 'WVWZZZ1KZ8W123456',
        makeAndModel: 'Volkswagen Passat',
        releaseYear: '2020',
        manufacture: 'Volkswagen',
        typeOfDrive: 'FWD',
        power: '110 кВт/150 л.с.',
        hasChassisNumber: false,
        bodyColor: 'Черный',
        transmissionType: 'AT',
        steeringWheel: 'Левостороннее',
        engineModel: 'EA888',
        engineVolume: 1984
    },
    department: {
        unitCode: '123456',
        departmentName: 'Тестовый отдел регистрации',
        address: 'ул. Проверочная, д. 10'
    },
    regOp: {
        vin: 'WVWZZZ1KZ8W123456',
        unitCode: '123456',
        operationType: 'Постановка на учет',
        operationBase: 'Приказ №123',
        operationDate: '2024-03-20T10:00:00.000Z'
    },
    regDoc: {
        registrationNumber: 'А123АА77',
        address: 'г. Москва, ул. Пушкина, д. 1',
        pts: '12 АБ 345678',
        sts: '12 34 567890',
        registrationDate: '2024-03-20',
        documentOwner: '1234 567890'
    }
};

beforeAll(async () => {
    await request(app).post('/api/auth/register/natural-person').send(testData.naturalPerson);
    await request(app).post('/api/owner/vehicles').send(testData.vehicle);
    await request(app).post('/api/admin/reg-depart').send(testData.department);
    await request(app).post('/api/owner/reg-op').send(testData.regOp);
    await request(app).post('/api/employee/reg-docs').send(testData.regDoc);
});

describe('Registration Operation API', () => {
    describe('GET Operations', () => {
        // Тест получения всех операций с пагинацией
        test('should get all registration operations with pagination', async () => {
            const response = await request(app)
                .get('/api/employee/reg-op')
                .query({
                    limit: 10,
                    page: 1
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('pages');
            expect(response.body).toHaveProperty('currentPage');
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        // Тест фильтрации операций по VIN
        test('should filter operations by VIN', async () => {
            const response = await request(app)
                .get('/api/employee/reg-op')
                .query({
                    vin: testData.vehicle.vin
                });

            expect(response.status).toBe(200);
            expect(response.body.data.every(op => op.vin === testData.vehicle.vin)).toBe(true);
        });

        // Тест фильтрации операций по коду подразделения
        test('should filter operations by unit code', async () => {
            const response = await request(app)
                .get('/api/employee/reg-op')
                .query({
                    unitCode: testData.department.unitCode
                });

            expect(response.status).toBe(200);
            expect(response.body.data.every(op => op.unitCode === testData.department.unitCode)).toBe(true);
        });

        // Тест фильтрации операций по типу операции
        test('should filter operations by operation type', async () => {
            const response = await request(app)
                .get('/api/employee/reg-op')
                .query({
                    operationType: 'Постановка на учет'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.every(op => op.operationType === 'Постановка на учет')).toBe(true);
        });

        // Тест фильтрации операций по диапазону дат
        test('should filter operations by date range', async () => {
            const response = await request(app)
                .get('/api/employee/reg-op')
                .query({
                    startDate: '2024-03-20',
                    endDate: '2024-03-20'
                });

            expect(response.status).toBe(200);
            expect(response.body.data.every(op => {
                const date = new Date(op.operationDate);
                return date >= new Date('2024-03-20T00:00:00.000Z') && 
                       date <= new Date('2024-03-20T23:59:59.999Z');
            })).toBe(true);
        });

        // Тест валидации параметров запроса
        test('should validate query parameters', async () => {
            const response = await request(app)
                .get('/api/employee/reg-op')
                .query({
                    limit: 0,
                    page: -1,
                    vin: 'invalid-vin',
                    unitCode: '123',
                    operationType: 'InvalidType',
                    startDate: 'invalid-date',
                    endDate: 'invalid-date'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('Get by VIN', () => {
        // Тест получения операций по корректному VIN
        test('should get operations by VIN', async () => {
            const response = await request(app)
                .get(`/api/employee/reg-op/${testData.vehicle.vin}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data.every(op => op.vin === testData.vehicle.vin)).toBe(true);
        });

        // Тест обработки несуществующего VIN
        test('should return 404 for non-existent VIN', async () => {
            const response = await request(app)
                .get('/api/employee/reg-op/WVWZZZ1KZ8W999999');

            expect(response.status).toBe(404);
        });

        // Тест валидации формата VIN
        test('should validate VIN format', async () => {
            const response = await request(app)
                .get('/api/employee/reg-op/invalid-vin');

            expect(response.status).toBe(400);
        });
    });

    describe('PATCH Operations', () => {
        let operationId;

        beforeAll(async () => {
            const response = await request(app)
                .get(`/api/employee/reg-op/${testData.vehicle.vin}`);
            operationId = response.body.data[0].operationId;
        });

        // Тест обновления операции с валидными данными
        test('should update operation with valid data', async () => {
            const response = await request(app)
                .patch(`/api/employee/reg-op/${operationId}`)
                .send({
                    registrationNumber: testData.regDoc.registrationNumber,
                    operationDate: '2024-03-20T10:45:00.000Z'
                });

            expect(response.status).toBe(200);
            expect(response.body.registrationNumber).toBe(testData.regDoc.registrationNumber);
            expect(response.body.operationDate).toBe('2024-03-20T10:45:00.000Z');
        });

        // Тест обновления только указанных полей
        test('should update only provided fields', async () => {
            const response = await request(app)
                .patch(`/api/employee/reg-op/${operationId}`)
                .send({
                    registrationNumber: testData.regDoc.registrationNumber
                });

            expect(response.status).toBe(200);
            expect(response.body.registrationNumber).toBe(testData.regDoc.registrationNumber);
        });

        // Тест валидации ID операции
        test('should validate operation ID', async () => {
            const response = await request(app)
                .patch('/api/employee/reg-op/invalid-id')
                .send({
                    registrationNumber: testData.regDoc.registrationNumber
                });

            expect(response.status).toBe(400);
        });

        // Тест валидации тела запроса
        test('should validate request body', async () => {
            const response = await request(app)
                .patch(`/api/employee/reg-op/${operationId}`)
                .send({
                    registrationNumber: 'invalid-number',
                    operationDate: 'invalid-date'
                });

            expect(response.status).toBe(400);
        });

        // Тест обработки несуществующей операции
        test('should return 404 for non-existent operation', async () => {
            const response = await request(app)
                .patch('/api/employee/reg-op/999999')
                .send({
                    registrationNumber: testData.regDoc.registrationNumber
                });

            expect(response.status).toBe(404);
        });
    });
}); 