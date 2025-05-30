const request = require('supertest');
const app = require('../../app');

describe('Registration Document API', () => {
  // Тестовые данные для владельцев и документов
  const testData = {
    naturalPerson1: {
      isNaturalPerson: true,
      passportData: '1234 567890',
      address: 'г. Москва, ул. Пушкина, д. 1',
      lastName: 'Иванов',
      firstName: 'Иван',
      patronymic: 'Иванович'
    },
    naturalPerson2: {
      isNaturalPerson: true,
      passportData: '5678 901234',
      address: 'г. Москва, ул. Новая, д. 1',
      lastName: 'Петров',
      firstName: 'Петр',
      patronymic: 'Петрович'
    },
    legalEntity1: {
      isNaturalPerson: false,
      taxNumber: '1234567890',
      address: 'г. Москва, ул. Лермонтова, д. 2',
      companyName: 'ООО Тест'
    },
    legalEntity2: {
      isNaturalPerson: false,
      taxNumber: '0987654321',
      address: 'г. Москва, ул. Обновленная, д. 1',
      companyName: 'ООО Тест2'
    },
    regDocNaturalPerson: {
      registrationNumber: 'А123АА77',
      address: 'г. Москва, ул. Пушкина, д. 1',
      pts: '12 АБ 345678',
      sts: '12 34 567890',
      registrationDate: '2024-03-20',
      documentOwner: '1234 567890'
    },
    regDocLegalEntity: {
      registrationNumber: 'В456ВВ78',
      address: 'г. Москва, ул. Лермонтова, д. 2',
      pts: '34 ВГ 789012',
      sts: '34 56 789012',
      registrationDate: '2024-03-20',
      documentOwner: '1234567890'
    }
  };

  beforeAll(async () => {
    await request(app).post('/api/auth/register/natural-person').send(testData.naturalPerson1);
    await request(app).post('/api/auth/register/natural-person').send(testData.naturalPerson2);
    await request(app).post('/api/auth/register/legal-entity').send(testData.legalEntity1);
    await request(app).post('/api/auth/register/legal-entity').send(testData.legalEntity2);

    await request(app).post('/api/employee/reg-docs').send(testData.regDocNaturalPerson);
    await request(app).post('/api/employee/reg-docs').send(testData.regDocLegalEntity);
  });

  afterAll(async () => {
    await request(app)
      .delete(`/api/auth/natural-persons/${testData.naturalPerson1.passportData}`)
      .catch(() => {});
    await request(app)
      .delete(`/api/auth/natural-persons/${testData.naturalPerson2.passportData}`)
      .catch(() => {});
    await request(app)
      .delete(`/api/auth/legal-entities/${testData.legalEntity1.taxNumber}`)
      .catch(() => {});
    await request(app)
      .delete(`/api/auth/legal-entities/${testData.legalEntity2.taxNumber}`)
      .catch(() => {});
  });

  describe('GET Operations', () => {
    describe('List & Search', () => {
      // Тест получения всех документов с пагинацией
      test('should get all registration documents with pagination', async () => {
        const res = await request(app)
          .get('/api/employee/reg-docs')
          .query({ page: 1, limit: 10 });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('pages');
        expect(res.body).toHaveProperty('currentPage', 1);
        expect(res.body).toHaveProperty('data');
      });

      // Тест поиска документов по номеру ПТС
      test('should search documents by PTS', async () => {
        const res = await request(app)
          .get('/api/employee/reg-docs')
          .query({ search: testData.regDocNaturalPerson.pts });
        
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              pts: testData.regDocNaturalPerson.pts
            })
          ])
        );
      });

      // Тест поиска документов по номеру СТС
      test('should search documents by STS', async () => {
        const res = await request(app)
          .get('/api/employee/reg-docs')
          .query({ search: testData.regDocNaturalPerson.sts });
        
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              sts: testData.regDocNaturalPerson.sts
            })
          ])
        );
      });

      // Тест поиска документов по адресу
      test('should search documents by address', async () => {
        const res = await request(app)
          .get('/api/employee/reg-docs')
          .query({ search: testData.regDocNaturalPerson.address });
        
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              address: testData.regDocNaturalPerson.address
            })
          ])
        );
      });

      // Тест поиска документов по владельцу
      test('should search documents by document owner', async () => {
        const res = await request(app)
          .get('/api/employee/reg-docs')
          .query({ documentOwner: testData.regDocNaturalPerson.documentOwner });
        
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              documentOwner: testData.regDocNaturalPerson.documentOwner
            })
          ])
        );
      });

      // Тест поиска документов по диапазону дат
      test('should search documents by date range', async () => {
        const res = await request(app)
          .get('/api/employee/reg-docs')
          .query({ 
            startDate: '2024-03-19',
            endDate: '2024-03-21'
          });
        
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              registrationDate: expect.stringMatching(/2024-03-20/)
            })
          ])
        );
      });
    });

    describe('Get by Registration Number', () => {
      // Тест получения документа по корректному регистрационному номеру
      test('should get document by valid registration number', async () => {
        const res = await request(app)
          .get(`/api/employee/reg-docs/${testData.regDocNaturalPerson.registrationNumber}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
          registrationNumber: testData.regDocNaturalPerson.registrationNumber,
          address: testData.regDocNaturalPerson.address,
          pts: testData.regDocNaturalPerson.pts,
          sts: testData.regDocNaturalPerson.sts,
          documentOwner: testData.regDocNaturalPerson.documentOwner
        });
      });

      // Тест обработки некорректного формата регистрационного номера
      test('should return 400 for invalid registration number format', async () => {
        const res = await request(app)
          .get('/api/employee/reg-docs/invalid');
        
        expect(res.statusCode).toBe(400);
      });

      // Тест обработки несуществующего регистрационного номера
      test('should return 404 for non-existent registration number', async () => {
        const res = await request(app)
          .get('/api/employee/reg-docs/А999АА99');
        
        expect(res.statusCode).toBe(404);
      });
    });
  });

  describe('POST Operations', () => {
    // Тест обработки некорректных данных документа
    test('should return 400 for invalid document data', async () => {
      const invalidData = {
        ...testData.regDocNaturalPerson,
        pts: 'invalid'
      };

      const res = await request(app)
        .post('/api/employee/reg-docs')
        .send(invalidData);
      
      expect(res.statusCode).toBe(400);
    });

    // Тест обработки дублирования регистрационного номера
    test('should return 409 for duplicate registration number', async () => {
      const duplicateData = {
        ...testData.regDocNaturalPerson,
        pts: '56 ДЕ 345678',
        sts: '56 78 345678'
      };

      const res = await request(app)
        .post('/api/employee/reg-docs')
        .send(duplicateData);
      
      expect(res.statusCode).toBe(409);
    });

    // Тест обработки дублирования номера ПТС
    test('should return 409 for duplicate PTS', async () => {
      const duplicatePtsData = {
        ...testData.regDocLegalEntity,
        registrationNumber: 'Е789ЕЕ79',
        pts: testData.regDocNaturalPerson.pts
      };

      const res = await request(app)
        .post('/api/employee/reg-docs')
        .send(duplicatePtsData);
      
      expect(res.statusCode).toBe(409);
    });

    // Тест обработки дублирования номера СТС
    test('should return 409 for duplicate STS', async () => {
      const duplicateStsData = {
        ...testData.regDocLegalEntity,
        registrationNumber: 'Е789ЕЕ79',
        sts: testData.regDocNaturalPerson.sts
      };

      const res = await request(app)
        .post('/api/employee/reg-docs')
        .send(duplicateStsData);
      
      expect(res.statusCode).toBe(409);
    });
  });

  describe('PUT Operations', () => {
    // Тест полного обновления документа
    test('should update document', async () => {
      const updateData = {
        address: testData.naturalPerson2.address,
        pts: '56 ДЕ 345678',
        sts: '56 78 345678',
        registrationDate: '2024-03-21',
        documentOwner: testData.naturalPerson2.passportData
      };

      const res = await request(app)
        .put(`/api/employee/reg-docs/${testData.regDocNaturalPerson.registrationNumber}`)
        .send(updateData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        registrationNumber: testData.regDocNaturalPerson.registrationNumber,
        address: updateData.address,
        pts: updateData.pts,
        sts: updateData.sts,
        documentOwner: updateData.documentOwner
      });
      expect(new Date(res.body.registrationDate).toISOString().split('T')[0]).toBe(updateData.registrationDate);
    });

    // Тест обработки некорректных данных при обновлении
    test('should return 400 for invalid update data', async () => {
      const invalidData = {
        address: 'г. Москва, ул. Новая, д. 1',
        pts: 'invalid',
        sts: '56 78 345678',
        registrationDate: '2024-03-21',
        documentOwner: testData.regDocNaturalPerson.documentOwner
      };

      const res = await request(app)
        .put(`/api/employee/reg-docs/${testData.regDocNaturalPerson.registrationNumber}`)
        .send(invalidData);
      
      expect(res.statusCode).toBe(400);
    });

    // Тест обработки попытки обновления несуществующего документа
    test('should return 404 for non-existent document', async () => {
      const res = await request(app)
        .put('/api/employee/reg-docs/А999АА99')
        .send({
          address: 'г. Москва, ул. Новая, д. 1',
          pts: '56 ДЕ 345678',
          sts: '56 78 345678',
          registrationDate: '2024-03-21',
          documentOwner: testData.regDocNaturalPerson.documentOwner
        });
      
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH Operations', () => {
    // Тест частичного обновления документа
    test('should patch document', async () => {
      const patchData = {
        address: testData.legalEntity2.address
      };

      const res = await request(app)
        .patch(`/api/employee/reg-docs/${testData.regDocNaturalPerson.registrationNumber}`)
        .send(patchData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        registrationNumber: testData.regDocNaturalPerson.registrationNumber,
        ...patchData
      });
    });

    // Тест обработки некорректных данных при частичном обновлении
    test('should return 400 for invalid patch data', async () => {
      const invalidData = {
        pts: 'invalid'
      };

      const res = await request(app)
        .patch(`/api/employee/reg-docs/${testData.regDocNaturalPerson.registrationNumber}`)
        .send(invalidData);
      
      expect(res.statusCode).toBe(400);
    });

    // Тест обработки попытки частичного обновления несуществующего документа
    test('should return 404 for non-existent document', async () => {
      const res = await request(app)
        .patch('/api/employee/reg-docs/А999АА99')
        .send({ address: 'г. Москва, ул. Новая, д. 1' });
      
      expect(res.statusCode).toBe(404);
    });
  });
}); 