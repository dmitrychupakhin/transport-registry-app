const request = require('supertest');
const app = require('../../app');

describe('Transport Vehicle API', () => {
    const testData = {
        vehicle1: {
            vin: 'XTA210990Y2765432',
            makeAndModel: 'Lada Vesta',
            releaseYear: '2023',
            manufacture: 'АвтоВАЗ',
            typeOfDrive: 'FWD',
            power: '78 кВт/106 л.с.',
            hasChassisNumber: true,
            bodyColor: 'Белый',
            transmissionType: 'MT',
            steeringWheel: 'Левостороннее',
            engineModel: '21129',
            engineVolume: 1596
        },
        vehicle2: {
            vin: 'XTA210990Y2765433',
            makeAndModel: 'Lada Granta',
            releaseYear: '2022',
            manufacture: 'АвтоВАЗ',
            typeOfDrive: 'FWD',
            power: '66 кВт/90 л.с.',
            hasChassisNumber: false,
            bodyColor: 'Черный',
            transmissionType: 'MT',
            steeringWheel: 'Левостороннее',
            engineModel: '21116',
            engineVolume: 1596
        }
    };

    beforeAll(async () => {
        await request(app)
            .post('/api/owner/vehicles')
            .send(testData.vehicle1);
        
        await request(app)
            .post('/api/owner/vehicles')
            .send(testData.vehicle2);
    });

    describe('GET Operations', () => {
        describe('getAllTransportVehicle', () => {
            // Тест получения списка транспортных средств с пагинацией
            test('should get all vehicles with pagination', async () => {
                const res = await request(app)
                    .get('/api/employee/vehicles')
                    .query({ page: 1, limit: 10 });
                
                expect(res.statusCode).toBe(200);
                expect(res.body).toHaveProperty('data');
                expect(res.body).toHaveProperty('pagination');
                expect(res.body.pagination).toHaveProperty('total');
                expect(res.body.pagination).toHaveProperty('page', 1);
                expect(res.body.pagination).toHaveProperty('limit', 10);
                expect(res.body.pagination).toHaveProperty('totalPages');
            });

            // Тест фильтрации транспортных средств по марке и модели
            test('should filter vehicles by makeAndModel', async () => {
                const res = await request(app)
                    .get('/api/employee/vehicles')
                    .query({ makeAndModel: 'Vesta' });
                
                expect(res.statusCode).toBe(200);
                expect(res.body.data).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            makeAndModel: 'Lada Vesta'
                        })
                    ])
                );
            });

            // Тест фильтрации транспортных средств по году выпуска
            test('should filter vehicles by releaseYear', async () => {
                const res = await request(app)
                    .get('/api/employee/vehicles')
                    .query({ releaseYear: '2023' });
                
                expect(res.statusCode).toBe(200);
                expect(res.body.data).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            releaseYear: '2023'
                        })
                    ])
                );
            });

            // Тест фильтрации транспортных средств по диапазону объема двигателя
            test('should filter vehicles by engineVolume range', async () => {
                const res = await request(app)
                    .get('/api/employee/vehicles')
                    .query({ 
                        engineVolumeFrom: 1500,
                        engineVolumeTo: 1600
                    });
                
                expect(res.statusCode).toBe(200);
                expect(res.body.data).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            engineVolume: 1596
                        })
                    ])
                );
            });

            // Тест сортировки транспортных средств по году выпуска в порядке убывания
            test('should sort vehicles by releaseYear in descending order', async () => {
                const res = await request(app)
                    .get('/api/employee/vehicles')
                    .query({ 
                        sortBy: 'releaseYear',
                        sortOrder: 'DESC'
                    });
                
                expect(res.statusCode).toBe(200);
                const years = res.body.data.map(v => v.releaseYear);
                expect(years).toEqual([...years].sort((a, b) => b - a));
            });
        });

        describe('getTransportVehicleByVin', () => {
            // Тест получения транспортного средства по корректному VIN
            test('should get vehicle by valid VIN', async () => {
                const res = await request(app)
                    .get(`/api/employee/vehicles/${testData.vehicle1.vin}`);
                
                expect(res.statusCode).toBe(200);
                expect(res.body.data).toMatchObject({
                    vin: testData.vehicle1.vin,
                    makeAndModel: testData.vehicle1.makeAndModel,
                    releaseYear: testData.vehicle1.releaseYear,
                    manufacture: testData.vehicle1.manufacture,
                    typeOfDrive: testData.vehicle1.typeOfDrive,
                    power: testData.vehicle1.power,
                    bodyColor: testData.vehicle1.bodyColor,
                    transmissionType: testData.vehicle1.transmissionType,
                    steeringWheel: testData.vehicle1.steeringWheel,
                    engineModel: testData.vehicle1.engineModel,
                    engineVolume: testData.vehicle1.engineVolume
                });
            });

            // Тест обработки некорректного формата VIN
            test('should return 400 for invalid VIN format', async () => {
                const res = await request(app)
                    .get('/api/employee/vehicles/invalid-vin');
                
                expect(res.statusCode).toBe(400);
                expect(res.body).toHaveProperty('message');
            });

            // Тест обработки запроса несуществующего VIN
            test('should return 404 for non-existent VIN', async () => {
                const res = await request(app)
                    .get('/api/employee/vehicles/XTA210990Y2765439');
                
                expect(res.statusCode).toBe(404);
                expect(res.body).toHaveProperty('message');
            });
        });
    });

    describe('PUT Operations', () => {
        describe('updateTransportVehicle', () => {
            // Тест полного обновления транспортного средства с валидными данными
            test('should update vehicle with valid data', async () => {
                const updateData = {
                    makeAndModel: 'Lada Vesta',
                    releaseYear: '2023',
                    manufacture: 'АвтоВАЗ',
                    typeOfDrive: 'FWD',
                    power: '78 кВт/106 л.с.',
                    bodyColor: 'Белый',
                    transmissionType: 'MT',
                    steeringWheel: 'Левостороннее',
                    engineModel: '21129',
                    engineVolume: 1596
                };

                const res = await request(app)
                    .put(`/api/employee/vehicles/${testData.vehicle1.vin}`)
                    .send(updateData);
                
                expect(res.statusCode).toBe(200);
                expect(res.body.data).toMatchObject({
                    vin: testData.vehicle1.vin,
                    makeAndModel: updateData.makeAndModel,
                    releaseYear: updateData.releaseYear,
                    manufacture: updateData.manufacture,
                    typeOfDrive: updateData.typeOfDrive,
                    power: updateData.power,
                    bodyColor: updateData.bodyColor,
                    transmissionType: updateData.transmissionType,
                    steeringWheel: updateData.steeringWheel,
                    engineModel: updateData.engineModel,
                    engineVolume: updateData.engineVolume
                });
            });

            // Тест полного обновления транспортного средства с валидными данными и номером шасси
            test('should handle hasChassisNumber update', async () => {
                const updateData = {
                    makeAndModel: 'Lada Vesta',
                    releaseYear: '2023',
                    manufacture: 'АвтоВАЗ',
                    typeOfDrive: 'FWD',
                    power: '78 кВт/106 л.с.',
                    bodyColor: 'Белый',
                    transmissionType: 'MT',
                    steeringWheel: 'Левостороннее',
                    engineModel: '21129',
                    engineVolume: 1596,
                    hasChassisNumber: false
                };

                const res = await request(app)
                    .put(`/api/employee/vehicles/${testData.vehicle1.vin}`)
                    .send(updateData);
                
                expect(res.statusCode).toBe(200);
                expect(res.body.data).toMatchObject({
                    vin: testData.vehicle1.vin,
                    chassisNumber: null
                });
            });

            // Тест обработки невалидных данных при обновлении
            test('should return 400 for invalid data', async () => {
                const res = await request(app)
                    .put(`/api/employee/vehicles/${testData.vehicle1.vin}`)
                    .send({
                        power: 'invalid'
                    });
                
                expect(res.statusCode).toBe(400);
                expect(res.body).toHaveProperty('message');
            });

            // Тест обработки попытки обновления несуществующего транспортного средства
            test('should return 404 for non-existent VIN', async () => {
                const res = await request(app)
                    .put('/api/employee/vehicles/XTA210990Y2765439')
                    .send({
                        makeAndModel: 'Test',
                        releaseYear: '2023',
                        manufacture: 'АвтоВАЗ',
                        typeOfDrive: 'FWD',
                        power: '78 кВт/106 л.с.',
                        bodyColor: 'Белый',
                        transmissionType: 'MT',
                        steeringWheel: 'Левостороннее',
                        engineModel: '21129',
                        engineVolume: 1596
                    });
                
                expect(res.statusCode).toBe(404);
                expect(res.body).toHaveProperty('message');
            });
        });
    });

    describe('PATCH Operations', () => {
        describe('patchTransportVehicle', () => {
            // Тест частичного обновления транспортного средства
            test('should partially update vehicle', async () => {
                const updateData = {
                    bodyColor: 'Синий',
                    power: '88 кВт/120 л.с.'
                };

                const res = await request(app)
                    .patch(`/api/employee/vehicles/${testData.vehicle2.vin}`)
                    .send(updateData);
                
                expect(res.statusCode).toBe(200);
                expect(res.body.data).toMatchObject({
                    vin: testData.vehicle2.vin,
                    bodyColor: updateData.bodyColor,
                    power: updateData.power
                });
            });

            // Тест обновления наличия номера шасси через PATCH запрос
            test('should handle hasChassisNumber update in patch', async () => {
                const updateData = {
                    hasChassisNumber: true
                };

                const res = await request(app)
                    .patch(`/api/employee/vehicles/${testData.vehicle2.vin}`)
                    .send(updateData);
                
                expect(res.statusCode).toBe(200);
                expect(res.body.data).toMatchObject({
                    vin: testData.vehicle2.vin,
                    chassisNumber: testData.vehicle2.vin
                });
            });

            // Тест обработки невалидных данных при частичном обновлении
            test('should return 400 for invalid data', async () => {
                const res = await request(app)
                    .patch(`/api/employee/vehicles/${testData.vehicle2.vin}`)
                    .send({
                        power: 'invalid'
                    });
                
                expect(res.statusCode).toBe(400);
                expect(res.body).toHaveProperty('message');
            });

            // Тест обработки попытки частичного обновления несуществующего транспортного средства
            test('should return 404 for non-existent VIN', async () => {
                const res = await request(app)
                    .patch('/api/employee/vehicles/XTA210990Y2765439')
                    .send({
                        makeAndModel: 'Test'
                    });
                
                expect(res.statusCode).toBe(404);
                expect(res.body).toHaveProperty('message');
            });
        });
    });
}); 