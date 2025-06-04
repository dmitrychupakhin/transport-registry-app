const Router = require('express');
const router = new Router();
const regDocController = require('../controllers/owner/regDocController');
const vehicleController = require('../controllers/owner/vehicleController');
const regDepartController = require('../controllers/owner/regDepartController');
const regOpController = require('../controllers/owner/regOpController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/reg-docs', authMiddleware, regDocController.getAllRegDoc);
router.get('/reg-docs/:regNumber', authMiddleware, regDocController.getRegDocByRegNumber);

router.get('/reg-op', authMiddleware, regOpController.getAllRegOp);
router.get('/reg-op/:vin', authMiddleware, regOpController.getRegOpByVin);
router.post('/reg-op', regOpController.createRegOp);

router.get('/vehicles', authMiddleware, vehicleController.getMyVehicles);
router.get('/vehicles/:vin/', authMiddleware, vehicleController.getMyVehicleByVin);
router.post('/vehicles', vehicleController.createVehicle);

router.get('/depart-info', regDepartController.getRegDepart);

module.exports = router;