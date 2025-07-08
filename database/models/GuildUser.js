const { DataTypes } = require("sequelize");
const sequelize = require("../../utils/sequelize");
const User = require("./User"); // Adjust path as needed

const GuildUser = sequelize.define("GuildUser", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id"
    }
  },
  guild_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "The Discord server (guild) ID"
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
}, {
  tableName: "guild_users",
  timestamps: true,
  uniqueKeys: {
    unique_user_guild: {
      fields: ['user_id', 'guild_id']
    }
  }
});

User.hasMany(GuildUser, { foreignKey: 'user_id' });
GuildUser.belongsTo(User, { foreignKey: 'user_id' });

module.exports = GuildUser;
