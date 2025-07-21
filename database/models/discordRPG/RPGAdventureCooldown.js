const { DataTypes } = require('sequelize');
const sequelize = require('../../../utils/sequelize');

const RPGAdventureCooldown = sequelize.define('RPGAdventureCooldown', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.STRING, allowNull: false },
  adventure_id: { type: DataTypes.INTEGER, allowNull: false},
  expires_at: { type: DataTypes.DATE, allowNull: false }
}, {
  tableName: 'rpg_adventure_cooldowns',
  timestamps: false
});

module.exports = RPGAdventureCooldown;
