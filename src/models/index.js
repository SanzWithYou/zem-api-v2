const { Sequelize } = require('sequelize');
const sequelize = require('../config/sequelize');
const userModel = require('./user');
const jokiOrderModel = require('./jokiOrder');

// Models
const models = {
  User: userModel(sequelize, Sequelize.DataTypes),
  JokiOrder: jokiOrderModel(sequelize, Sequelize.DataTypes),
};

// Asosiasi
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
