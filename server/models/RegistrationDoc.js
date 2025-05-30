const sequelize = require("../db");
const {DataTypes} = require("sequelize");

const RegistrationDoc = sequelize.define('registrationdoc', {
    registrationNumber: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
        allowNull: false
    },   
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    pts: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    sts: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    documentOwner: {
        type: DataTypes.STRING,
        allowNull: true
    },
    registrationDate: {
        type: DataTypes.DATE,
        allowNull: false
    }    
}, {
    tableName: 'registrationdoc'
});

module.exports = RegistrationDoc;