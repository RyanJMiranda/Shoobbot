const { DataTypes } = require("sequelize");
const sequelize = require("../../utils/sequelize");

  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      discord_user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: "The unique Discord user ID",
      },
      global_experience: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Total global experience points",
      },
      global_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Current global level",
      },
    },
    {
      tableName: "users", 
      timestamps: true,
      comment: "Stores global user profiles and experience",
    }
  );

  module.exports = User;
