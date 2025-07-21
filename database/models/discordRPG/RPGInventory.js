const { DataTypes } = require('sequelize');
const sequelize = require('../../../utils/sequelize');
const RPGCharacter = require('./RPGCharacter');

const RPGInventory = sequelize.define('RPGInventory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  character_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'rpg_characters', key: 'id' }},
  money: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, // copper
  max_slots: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 28 }
}, {
  tableName: 'rpg_inventories',
  timestamps: false
});

// Set up the association
RPGCharacter.hasOne(RPGInventory, { foreignKey: 'character_id' });
RPGInventory.belongsTo(RPGCharacter, { foreignKey: 'character_id' });

module.exports = RPGInventory;
