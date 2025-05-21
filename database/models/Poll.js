const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/sequelize');

const Poll = sequelize.define('Poll', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    guild_id: { type: DataTypes.STRING, allowNull: false },
    channel_id: { type: DataTypes.STRING, allowNull: false },
    message_id: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    options: { type: DataTypes.JSON, allowNull: false }, 
    single_vote: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    ends_at: { type: DataTypes.DATE, allowNull: false },
    closed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    results: { type: DataTypes.JSON, allowNull: true },
    created_by: { type: DataTypes.STRING, allowNull: false }
}, {
    tableName: 'polls',
    timestamps: true,             
    createdAt: 'created_at',      
    updatedAt: 'updated_at'
});

module.exports = Poll;
