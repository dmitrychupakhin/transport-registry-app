const sequelize = require("../db");
const {DataTypes} = require("sequelize");

const RegistrationDepart = sequelize.define('registrationdepart', {
    unitCode: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
        allowNull: false
    },
    departmentName: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    
    address: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    }
}, {
    tableName: 'registrationdepart'
});

module.exports = RegistrationDepart;