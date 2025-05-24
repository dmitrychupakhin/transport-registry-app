const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt');
const {User} = require('../models/associations');

class UserController {
    async registration(req, res){
        const { email, password, role } = req.body;
        if(!email || !password){
            return next(ApiError.badRequest('Некорректный email или password'));
        }
    }

    async login(req, res){

    }

    async check(req, res, next){

    }
}

module.exports = new UserController();