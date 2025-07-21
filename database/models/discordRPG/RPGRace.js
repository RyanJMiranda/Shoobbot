const { DataTypes } = require('sequelize');
const sequelize = require('../../../utils/sequelize');

const RPGRace = sequelize.define('RPGRace', {
  key: { type: DataTypes.STRING, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  bonus_attribute: { type: DataTypes.STRING, allowNull: false },
  bonus_title: { type: DataTypes.STRING, allowNull: false },
  malus_attribute: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'rpg_races',
  timestamps: false
});
module.exports = RPGRace;
