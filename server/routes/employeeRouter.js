const Router = require('express');
const router = new Router();
const regDocCrudController = require('../controllers/employee/regDocCrudController');
const ownerController = require('../controllers/employee/ownerController');
const regOpController = require('../controllers/employee/regOpController');
const workController = require('../controllers/employee/workController');
const vehicleController = require('../controllers/employee/vehicleController');

router.get('/natural-persons', ownerController.getAllNaturalPersons);
router.get('/natural-persons/:passport', ownerController.getNaturalPersonByPassport);
router.put('/natural-persons/:passport', ownerController.updateNaturalPerson);
router.patch('/natural-persons/:passport', ownerController.patchNaturalPerson);

router.get('/legal-entities', ownerController.getAllLegalEntities);
router.get('/legal-entities/:taxNumber', ownerController.getLegalEntitiesByTax);
router.put('/legal-entities/:taxNumber', ownerController.updateLegalEntity);
router.patch('/legal-entities/:taxNumber', ownerController.patchLegalEntity);

router.get('/reg-docs', regDocCrudController.getAllRegDoc);
router.get('/reg-docs/:regNumber', regDocCrudController.getRegDocByRegNumber);
router.post('/reg-docs', regDocCrudController.createRegDoc);
router.put('/reg-docs/:regNumber', regDocCrudController.updateRegDoc);
router.patch('/reg-docs/:regNumber', regDocCrudController.patchRegDoc);

router.get('/reg-op', regOpController.getAllRegOp);
router.get('/reg-op/:vin', regOpController.getRegOpByVin);
router.put('/reg-op/:id', regOpController.patchRegOp);

router.get('/work', workController.getAllWork);
router.post('/work', workController.createWork);
router.put('/work/:id', workController.updateWork);

router.get('/vehicles', vehicleController.getAllTransportVehicle);
router.get('/vehicles/:vin', vehicleController.getTransportVehicleByVin);
router.put('/vehicles/:vin', vehicleController.updateTransportVehicle);
router.patch('/vehicles/:vin', vehicleController.patchTransportVehicle);

module.exports = router;