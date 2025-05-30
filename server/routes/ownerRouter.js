const Router = require('express');
const router = new Router();
const regDocController = require('../controllers/owner/regDocController');
const vehicleController = require('../controllers/owner/vehicleController');
const ownerController = require('../controllers/owner/ownerController');
const regOpController = require('../controllers/owner/regOpController');

router.get('/documents', regDocController.getAllRegDoc);
router.post('/documents', regDocController.createRegDoc);

router.get('/reg-op', regOpController.getAllRegOp);
router.get('/reg-op/:vin', regOpController.getRegOpByVin);
router.post('/reg-op', regOpController.createRegOp);

router.get('/vehicles', vehicleController.getMyVehicles);
router.get('/vehicles/:vin/', vehicleController.getMyVehicleByVin);
router.post('/vehicles', vehicleController.createVehicle);

router.get('/operations', ownerController.getMyRegOps);
router.post('/depart-info', ownerController.getRegDepart);

module.exports = router;