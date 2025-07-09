const sequelize = require('../../utils/sequelize');
const RPGCharacter = require('../models/RPGCharacter');

(async () => {
  await sequelize.sync({ alter: true }); 
  console.log('Sequelize: RPGCharacter tables synced!');
  process.exit();
})();