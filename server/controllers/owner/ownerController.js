const { RegistrationOp, RegistrationDepart } = require('../../models/associations');
const ApiError = require("../../error/ApiError");

class OwnerController {
    async getMyRegOps(req, res, next){
        try {

        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }

    async getRegDepart(req, res, next){
        try {

        } catch (e) {
            return next(ApiError.internal(e.message));
        }
    }
}

module.exports = new OwnerController();