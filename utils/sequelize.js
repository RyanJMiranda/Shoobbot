const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/database.db', // or wherever your DB file should be
  logging: false
});

module.exports = sequelize;
