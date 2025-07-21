const { DataTypes } = require('sequelize');
const sequelize = require('../../../utils/sequelize');
const RPGInventory = require('./RPGInventory');
const RPGItem = require('./RPGItem');

const RPGInventorySlot = sequelize.define('RPGInventorySlot', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  inventory_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'rpg_inventories', key: 'id' }},
  slot_number: { type: DataTypes.INTEGER, allowNull: false },
  item_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'rpg_items', key: 'id' }},
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  locked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  tableName: 'rpg_inventory_slots',
  timestamps: false
});

// Associations
RPGInventory.hasMany(RPGInventorySlot, { foreignKey: 'inventory_id' });
RPGInventorySlot.belongsTo(RPGInventory, { foreignKey: 'inventory_id' });
RPGInventorySlot.belongsTo(RPGItem, { foreignKey: 'item_id' });

module.exports = RPGInventorySlot;
