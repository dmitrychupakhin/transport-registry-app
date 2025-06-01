const Router = require('express');
const router = new Router();
const regDocController = require('../controllers/owner/regDocController');
const vehicleController = require('../controllers/owner/vehicleController');
const regDepartController = require('../controllers/owner/regDepartController');
const regOpController = require('../controllers/owner/regOpController');

router.get('/reg-docs', regDocController.getAllRegDoc);
router.get('/reg-docs/:regNumber', regDocController.getRegDocByRegNumber);

router.get('/reg-op', regOpController.getAllRegOp);
router.get('/reg-op/:vin', regOpController.getRegOpByVin);
router.post('/reg-op', regOpController.createRegOp);

router.get('/vehicles', vehicleController.getMyVehicles);
router.get('/vehicles/:vin/', vehicleController.getMyVehicleByVin);
router.post('/vehicles', vehicleController.createVehicle);

router.get('/depart-info', regDepartController.getRegDepart);

module.exports = router;