const { DataTypes } = require('sequelize');
const sequelize = require('../../../utils/sequelize');

const RPGMonster = sequelize.define('RPGMonster', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  level: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  attributes: { type: DataTypes.JSON, allowNull: false }, // { strength: 8, dexterity: 12, ... }
  loot_table: { type: DataTypes.JSON, allowNull: true },  // e.g. [{item_id: 1, chance: 0.1}, ...]
}, {
  tableName: 'rpg_monsters',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = RPGMonster;
