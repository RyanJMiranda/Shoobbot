const { DataTypes } = require('sequelize');
const sequelize = require('../../../utils/sequelize');

const RPGClass = sequelize.define('RPGClass', {
  key: { type: DataTypes.STRING, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  primary_attribute: { type: DataTypes.STRING, allowNull: false },
  preferred_weapon_type: { type: DataTypes.STRING, allowNull: false },
  preferred_armour_class: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'rpg_classes',
  timestamps: false
});
module.exports = RPGClass;
