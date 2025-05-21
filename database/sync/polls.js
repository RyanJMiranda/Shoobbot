const sequelize = require('../../utils/sequelize');
const Poll = require('../models/Poll');

(async () => {
  await sequelize.sync({ alter: true }); // Use { force: true } for destructive resets
  console.log('Sequelize: Polls table synced!');
  process.exit();
})();