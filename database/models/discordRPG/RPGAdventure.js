const { DataTypes } = require('sequelize');
const sequelize = require('../../../utils/sequelize');

const RPGAdventure = sequelize.define('RPGAdventure', {
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  min_level: DataTypes.INTEGER,
  max_level: DataTypes.INTEGER,
  required_stats: DataTypes.JSON,
  monster_ids: DataTypes.JSON,
  possible_items: DataTypes.JSON,
  gold_min: DataTypes.INTEGER,
  gold_max: DataTypes.INTEGER,
  xp_min: DataTypes.INTEGER,
  xp_max: DataTypes.INTEGER,
}, { tableName: 'rpg_adventures', timestamps: true });

module.exports = RPGAdventure;
