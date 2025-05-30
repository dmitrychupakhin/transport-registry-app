const sequelize = require("../db");
const {DataTypes} = require("sequelize");

const TransportVehicle = sequelize.define('transportvehicle', {
    vin: {
        type: DataTypes.STRING,
        unique: true,
        primaryKey: true,
        allowNull: false
    },
    makeAndModel: {
        type: DataTypes.STRING,
        allowNull: false
    },
    releaseYear: {
        type: DataTypes.STRING,
        allowNull: false
    },
    manufacture: {
        type: DataTypes.STRING,
        allowNull: false
    },
    typeOfDrive: {
        type: DataTypes.STRING,
        allowNull: false
    },
    power: {
        type: DataTypes.STRING,
        allowNull: false
    },
    chassisNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bodyNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    bodyColor: {
        type: DataTypes.STRING,
        allowNull: false
    },
    transmissionType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    steeringWheel: {
        type: DataTypes.STRING,
        allowNull: false
    },
    engineModel: {
        type: DataTypes.STRING,
        allowNull: false
    },
    engineVolume: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'transportvehicle'
});

module.exports = TransportVehicle;