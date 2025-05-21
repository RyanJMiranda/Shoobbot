const sequelize = require('../../utils/sequelize');
const Message = require('../models/Message');

(async () => {
  await sequelize.sync({ alter: true }); // Use { force: true } for destructive resets
  console.log('Sequelize: Message table synced!');
  process.exit();
})();