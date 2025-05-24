const { TransportVehicle } = require('../../models/associations');
const ApiError = require("../../error/ApiError");

class VehicleController {
    async getMyVehicles(req, res, next){
        try {

        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async getMyVehicleById(req, res, next){
        try {

        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async createVehicle(req, res, next){
        try {

        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }
}

module.exports = new VehicleController();