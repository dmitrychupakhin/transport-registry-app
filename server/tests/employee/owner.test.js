const request = require('supertest');
const app = require('../../app');

describe('Owner API', () => {
  const testData = {
    naturalPerson: {
      isNaturalPerson: true,
      passportData: '1234 567890',
      address: 'г. Москва, ул. Пушкина, д. 1',
      lastName: 'Иванов',
      firstName: 'Иван',
      patronymic: 'Иванович'
    },
    legalEntity: {
      isNaturalPerson: false,
      taxNumber: '1234567890',
      address: 'г. Москва, ул. Лермонтова, д. 2',
      companyName: 'ООО Тест'
    },
    anotherNaturalPerson: {
      isNaturalPerson: true,
      passportData: '9876 543210',
      address: 'г. Москва, ул. Пушкина, д. 1',
      lastName: 'Петров',
      firstName: 'Петр',
      patronymic: 'Петрович'
    },
    registrationDocNaturalPerson: {
      registrationNumber: 'А123АА77',
      address: 'г. Москва, ул. Пушкина, д. 1',
      pts: '12 АБ 345678',
      sts: '12 34 567890',
      registrationDate: '2024-03-20',
      documentOwner: '1234 567890'
    },
    registrationDocLegalEntity: {
      registrationNumber: 'В456ВВ78',
      address: 'г. Москва, ул. Лермонтова, д. 2',
      pts: '34 ВГ 789012',
      sts: '34 56 789012',
      registrationDate: '2024-03-20',
      documentOwner: '1234567890'
    }
  };

  beforeAll(async () => {
    await request(app).post('/api/auth/register/natural-person').send(testData.naturalPerson);
    await request(app).post('/api/auth/register/natural-person').send(testData.anotherNaturalPerson);
    await request(app).post('/api/auth/register/legal-entity').send(testData.legalEntity);
    await request(app).post('/api/employee/reg-docs').send(testData.registrationDocNaturalPerson);
    await request(app).post('/api/employee/reg-docs').send(testData.registrationDocLegalEntity);
  });

  describe('Natural Person Operations', () => {
    describe('List & Search', () => {
      // Получение списка физических лиц с пагинацией
      test('should get all natural persons with pagination', async () => {
        const res = await request(app)
          .get('/api/employee/natural-persons')
          .query({ page: 1, limit: 10 });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('page', 1);
        expect(res.body).toHaveProperty('limit', 10);
        expect(res.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              passportData: testData.naturalPerson.passportData
            })
          ])
        );
      });

      // Сортировка физических лиц по номеру паспорта
      test('should sort natural persons by passportData', async () => {
        const res = await request(app)
          .get('/api/employee/natural-persons')
          .query({ sortBy: 'passportData', sortOrder: 'ASC' });
        
        expect(res.statusCode).toBe(200);
        const passports = res.body.data.map(p => p.passportData);
        const sorted = [...passports].sort();
        expect(passports).toEqual(sorted);
      });
    });

    describe('Get by Passport', () => {
      // Получение физического лица по валидному номеру паспорта
      test('should get natural person by valid passport', async () => {
        const res = await request(app)
          .get(`/api/employee/natural-persons/${testData.naturalPerson.passportData}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
          passportData: testData.naturalPerson.passportData,
          lastName: testData.naturalPerson.lastName,
          firstName: testData.naturalPerson.firstName,
          patronymic: testData.naturalPerson.patronymic,
          address: testData.naturalPerson.address
        });
      });

      // Проверка невалидного формата паспорта
      test('should return 400 for invalid passport format', async () => {
        const res = await request(app)
          .get('/api/employee/natural-persons/invalid');
        
        expect(res.statusCode).toBe(400);
      });

      // Проверка несуществующего паспорта
      test('should return 404 for non-existent passport', async () => {
        const res = await request(app)
          .get('/api/employee/natural-persons/9999 999999');
        
        expect(res.statusCode).toBe(404);
      });
    });

    describe('Update Operations', () => {
      // Полное обновление данных физического лица
      test('should update natural person', async () => {
        const updateData = {
          address: 'г. Москва, ул. Новая, д. 1',
          lastName: 'Иванов',
          firstName: 'Иван',
          patronymic: 'Иванович'
        };

        const res = await request(app)
          .put(`/api/employee/natural-persons/${testData.naturalPerson.passportData}`)
          .send(updateData);
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject(updateData);
      });

      // Частичное обновление адреса физического лица
      test('should patch natural person', async () => {
        const patchData = {
          address: 'г. Москва, ул. Обновленная, д. 1'
        };

        const res = await request(app)
          .patch(`/api/employee/natural-persons/${testData.naturalPerson.passportData}`)
          .send(patchData);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.address).toBe(patchData.address);
      });
    });
  });

  describe('Legal Entity Operations', () => {
    describe('List & Search', () => {
      // Получение списка юридических лиц с пагинацией
      test('should get all legal entities with pagination', async () => {
        const res = await request(app)
          .get('/api/employee/legal-entities')
          .query({ page: 1, limit: 10 });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('page', 1);
        expect(res.body).toHaveProperty('limit', 10);
        expect(res.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              taxNumber: testData.legalEntity.taxNumber
            })
          ])
        );
      });

      // Сортировка юридических лиц по ИНН
      test('should sort legal entities by taxNumber', async () => {
        const res = await request(app)
          .get('/api/employee/legal-entities')
          .query({ sortBy: 'taxNumber', sortOrder: 'ASC' });
        
        expect(res.statusCode).toBe(200);
        const taxNumbers = res.body.data.map(e => e.taxNumber);
        const sorted = [...taxNumbers].sort();
        expect(taxNumbers).toEqual(sorted);
      });
    });

    describe('Get by Tax Number', () => {
      // Получение юридического лица по валидному ИНН
      test('should get legal entity by valid tax number', async () => {
        const res = await request(app)
          .get(`/api/employee/legal-entities/${testData.legalEntity.taxNumber}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
          taxNumber: testData.legalEntity.taxNumber,
          companyName: testData.legalEntity.companyName,
          address: testData.legalEntity.address
        });
      });
      
      // Проверка невалидного формата ИНН
      test('should return 400 for invalid tax number format', async () => {
        const res = await request(app)
          .get('/api/employee/legal-entities/invalid');
        
        expect(res.statusCode).toBe(400);
      });

      // Проверка несуществующего ИНН
      test('should return 404 for non-existent tax number', async () => {
        const res = await request(app)
          .get('/api/employee/legal-entities/9999999999');
        
        expect(res.statusCode).toBe(404);
      });
    });

    describe('Update Operations', () => {
      // Полное обновление данных юридического лица
      test('should update legal entity', async () => {
        const updateData = {
          address: 'г. Москва, ул. Новая, д. 2',
          companyName: 'ООО Обновленное'
        };

        const res = await request(app)
          .put(`/api/employee/legal-entities/${testData.legalEntity.taxNumber}`)
          .send(updateData);
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject(updateData);
      });

      // Частичное обновление адреса юридического лица
      test('should patch legal entity', async () => {
        const patchData = {
          address: 'г. Москва, ул. Обновленная, д. 2'
        };

        const res = await request(app)
          .patch(`/api/employee/legal-entities/${testData.legalEntity.taxNumber}`)
          .send(patchData);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.address).toBe(patchData.address);
      });
    });
  });

  describe('Update Operations with Registration Documents', () => {
    describe('Natural Person Updates', () => {
      // Проверка обновления адреса владельца ТС и соответствующего изменения в регистрационном документе
      test('should update address and registration document when person is vehicle owner', async () => {
        const updateData = {
          address: 'г. Москва, ул. Новая, д. 1',
          lastName: 'Иванов',
          firstName: 'Иван',
          patronymic: 'Иванович'
        };

        const res = await request(app)
          .put(`/api/employee/natural-persons/${testData.naturalPerson.passportData}`)
          .send(updateData);
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject(updateData);

        // Проверяем, что адрес в регистрационном документе тоже обновился
        const updatedDoc = await request(app)
          .get(`/api/employee/reg-docs/${testData.registrationDocNaturalPerson.registrationNumber}`);
        
        expect(updatedDoc.statusCode).toBe(200);
        expect(updatedDoc.body.address).toBe(updateData.address);
      });

      // Проверка обновления адреса не владельца ТС и отсутствия изменений в регистрационном документе
      test('should update address without affecting registration document when person is not vehicle owner', async () => {
        const updateData = {
          address: 'г. Москва, ул. Другая, д. 1',
          lastName: 'Петров',
          firstName: 'Петр',
          patronymic: 'Петрович'
        };

        const res = await request(app)
          .put(`/api/employee/natural-persons/${testData.anotherNaturalPerson.passportData}`)
          .send(updateData);
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject(updateData);

        // Проверяем, что адрес в регистрационном документе не изменился
        const updatedDoc = await request(app)
          .get(`/api/employee/reg-docs/${testData.registrationDocNaturalPerson.registrationNumber}`);
        
        expect(updatedDoc.statusCode).toBe(200);
        expect(updatedDoc.body.address).toBe('г. Москва, ул. Новая, д. 1');
      });
    });

    describe('Legal Entity Updates', () => {
      // Проверка обновления адреса юридического лица - владельца ТС и соответствующего изменения в регистрационном документе
      test('should update address and registration document when legal entity is vehicle owner', async () => {
        const updateData = {
          address: 'г. Москва, ул. Новая, д. 2',
          companyName: 'ООО Обновленное'
        };

        const res = await request(app)
          .put(`/api/employee/legal-entities/${testData.legalEntity.taxNumber}`)
          .send(updateData);
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject(updateData);

        // Проверяем, что адрес в регистрационном документе тоже обновился
        const updatedDoc = await request(app)
          .get(`/api/employee/reg-docs/${testData.registrationDocLegalEntity.registrationNumber}`);
        
        expect(updatedDoc.statusCode).toBe(200);
        expect(updatedDoc.body.address).toBe(updateData.address);
      });
    });
  });
});