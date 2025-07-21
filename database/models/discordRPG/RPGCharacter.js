// /database/models/RPGCharacter.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../../utils/sequelize');
const User = require('../User');

const RPGCharacter = sequelize.define('RPGCharacter', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: User,
      key: 'id'
    }
  },

  race: { type: DataTypes.STRING, allowNull: true },
  class: { type: DataTypes.STRING, allowNull: true },

  strength: { type: DataTypes.INTEGER, defaultValue: 10 },
  dexterity: { type: DataTypes.INTEGER, defaultValue: 10},
  intelligence: { type: DataTypes.INTEGER, defaultValue: 10 },
  wisdom: { type: DataTypes.INTEGER, defaultValue: 10 },
  constitution: { type: DataTypes.INTEGER, defaultValue: 10 },
  charisma: { type: DataTypes.INTEGER, defaultValue: 10 },

  weapon_id: { type: DataTypes.INTEGER, allowNull: true },     // FK to Item (nullable)
  armour_id: { type: DataTypes.INTEGER, allowNull: true },     // FK to Item (nullable)
  accessory1_id: { type: DataTypes.INTEGER, allowNull: true }, // FK to Item (nullable)
  accessory2_id: { type: DataTypes.INTEGER, allowNull: true }, // FK to Item (nullable)

}, {
  tableName: 'rpg_characters',
  timestamps: true,  // created_at, updated_at
});

RPGCharacter.belongsTo(User, { foreignKey: 'user_id' });

module.exports = RPGCharacter;
