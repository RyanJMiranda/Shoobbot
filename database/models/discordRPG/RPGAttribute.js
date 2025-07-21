const { DataTypes } = require('sequelize');
const sequelize = require('../../../utils/sequelize');

const RPGAttribute = sequelize.define('RPGAttribute', {
  key: { type: DataTypes.STRING, primaryKey: true }, // 'strength', 'dexterity', etc
  label: { type: DataTypes.STRING, allowNull: false }, // "Strength"
  emoji: { type: DataTypes.STRING, allowNull: false }, // "💪"
  description: { type: DataTypes.TEXT, allowNull: false }
}, {
  tableName: 'rpg_attributes',
  timestamps: false
});

module.exports = RPGAttribute;
