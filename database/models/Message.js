const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/sequelize');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  server_id: { type: DataTypes.STRING, allowNull: false },
  channel_id: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  message_title: { type: DataTypes.STRING(255), allowNull: false },
  message_type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'message' },
  color: { type: DataTypes.STRING, allowNull: true },
  footer_text: { type: DataTypes.STRING, allowNull: true },
  repeat_hours: { type: DataTypes.FLOAT, allowNull: false },
  times_sent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  next_run_at: { type: DataTypes.STRING, allowNull: true },
  message_active: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  created_at: { type: DataTypes.STRING, allowNull: false },
  updated_at: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'messages',
  timestamps: false
});

module.exports = Message;
