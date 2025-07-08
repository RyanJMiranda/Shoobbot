const sequelize = require('../../utils/sequelize');
const User = require('../models/User');
const GuildUser = require('../models/GuildUser');

(async () => {
  await sequelize.sync({ alter: true }); 
  console.log('Sequelize: Users and GuildUser tables synced!');
  process.exit();
})();