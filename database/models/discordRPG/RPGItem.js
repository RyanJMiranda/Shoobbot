// /database/models/RPGItem.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../../utils/sequelize');

const RPGItem = sequelize.define('RPGItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false }, // 'weapon', 'armour', 'accessory'
  slot: { type: DataTypes.STRING, allowNull: false },
  attribute_bonus: { type: DataTypes.JSON, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  value: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  rarity: {type: DataTypes.FLOAT, allowNull: false, defaultValue: 1}
}, {
  tableName: 'rpg_items',
  timestamps: false
});
module.exports = RPGItem;
