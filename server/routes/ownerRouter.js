const Router = require('express');
const router = new Router();
const regDocController = require('../controllers/owner/regDocController');
const vehicleController = require('../controllers/owner/vehicleController');
const ownerController = require('../controllers/owner/ownerController');

router.get('/my/documents', regDocController.getAllRegDoc);
router.post('/my/documents', regDocController.createRegDoc);

router.get('/my/vehicles', vehicleController.getMyVehicles);
router.post('/vehicles', vehicleController.createVehicle);
router.get('/my/vehicles/:id/', vehicleController.getMyVehicleById);


router.get('/my/operations', ownerController.getMyRegOps);
router.post('/depart-info', ownerController.getRegDepart);

module.exports = router;