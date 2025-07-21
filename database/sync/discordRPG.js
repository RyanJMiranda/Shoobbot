const sequelize = require('../../utils/sequelize');
const RPGAttribute = require('../models/discordRPG/RPGAttribute');
const RPGRace = require('../models/discordRPG/RPGRace');
const RPGClass = require('../models/discordRPG/RPGClass');
const RPGCharacter = require('../models/discordRPG/RPGCharacter');
const RPGItem = require('../models/discordRPG/RPGItem');
const RPGInventory = require('../models/discordRPG/RPGInventory');
const RPGInventorySlot = require('../models/discordRPG/RPGInventorySlot');
const RPGMonster = require('../models/discordRPG/RPGMonster');
const RPGAdventure = require('../models/discordRPG/RPGAdventure');
const RPGAdventureCooldown = require('../models/discordRPG/RPGAdventureCooldown');
const RPGCombatEncounter = require('../models/discordRPG/RPGCombatEncounter');

(async () => {
  await sequelize.sync(); 
  console.log('Sequelize: discordRPG tables synced!');
  process.exit();
})();