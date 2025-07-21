// /database/models/discordRPG/RPGCombatEncounter.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../../utils/sequelize');

const RPGCombatEncounter = sequelize.define('RPGCombatEncounter', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.STRING, allowNull: false },
  character_id: { type: DataTypes.INTEGER, allowNull: false },
  monster_id: { type: DataTypes.INTEGER, allowNull: false },
  monster_hp: { type: DataTypes.INTEGER, allowNull: false },
  player_hp: { type: DataTypes.INTEGER, allowNull: false },
  player_max_hp: { type: DataTypes.INTEGER, allowNull: false },
  monster_max_hp: { type: DataTypes.INTEGER, allowNull: false },
  turn_number: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  combat_state: { type: DataTypes.JSON, allowNull: true },
  actions_log: { type: DataTypes.TEXT, allowNull: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
}, {
  tableName: 'rpg_combat_encounters',
  timestamps: true,
});
module.exports = RPGCombatEncounter;
