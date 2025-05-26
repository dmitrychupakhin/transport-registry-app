const Router = require('express');
const router = new Router();
const employeeCrudController = require('../controllers/admin/employeeCrudController');
const regDepartCrudController = require('../controllers/admin/regDepartCrudController');
const userCrudController = require('../controllers/admin/userCrudController');

router.get('/employees', employeeCrudController.getAllEmployees);
router.post('/employees', employeeCrudController.createEmployee);
router.put('/employees/:badgeNumber', employeeCrudController.updateEmployee);
router.patch('/employees/:badgeNumber', employeeCrudController.patchEmployee);
router.delete('/employees/:badgeNumber', employeeCrudController.deleteEmployee);

router.get('/reg-depart', regDepartCrudController.getAllRegDepart);
router.post('/reg-depart', regDepartCrudController.createRegDepart);
router.put('/reg-depart/:unitCode', regDepartCrudController.updateRegDepart);
router.patch('/reg-depart/:unitCode', regDepartCrudController.patchRegDepart);
router.delete('/reg-depart/:unitCode', regDepartCrudController.deleteRegDepart);

router.get('/users', userCrudController.getAllUser);
router.post('/users', userCrudController.createUser);
router.put('/users/:id', userCrudController.updateUser);
router.delete('/users/:id', userCrudController.deleteUser);

module.exports = router;