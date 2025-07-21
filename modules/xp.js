const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../database/models/User');
const GuildUser = require('../database/models/GuildUser');

// ---- Level Curve ----
const LEVEL_A = 0.15; // Adjust to tune curve

function levelForXP(xp) {
  return Math.floor(LEVEL_A * Math.sqrt(xp));
}
function xpForLevel(level) {
  return Math.ceil(Math.pow((level + 1) / LEVEL_A, 2));
}

// ---- Slash Commands ----
const commands = [
  new SlashCommandBuilder()
    .setName('xp')
    .setDescription('Show your (or another user\'s) XP and level')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to check')
        .setRequired(false))
    .toJSON(),
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show this server\'s XP leaderboard')
    .toJSON(),
];

function formatXPBar(current, target, length = 20) {
  const percent = Math.min(1, current / target);
  const filled = Math.round(percent * length);
  return '🟦'.repeat(filled) + '⬜'.repeat(length - filled);
}

function init(client) {
  // -- Award XP on message (anti-spam: 1 XP per 60s) --
  const cooldown = new Map();

  client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    const discordUserId = message.author.id;
    const guildId = message.guild.id;
    const key = `${guildId}-${discordUserId}`;
    const now = Date.now();
    const XP_DROP_DELAY = 5000;

    if (cooldown.has(key) && now - cooldown.get(key) < XP_DROP_DELAY) return;
    cooldown.set(key, now);

    // Get or create global User
    let user = await User.findOne({ where: { discord_user_id: discordUserId } });
    if (!user) user = await User.create({ discord_user_id: discordUserId });

    // Get or create GuildUser
    let guildUser = await GuildUser.findOne({ where: { user_id: user.id, guild_id: guildId } });
    if (!guildUser) guildUser = await GuildUser.create({ user_id: user.id, guild_id: guildId });

    // Add XP (customize as needed)
    const XP_AMOUNT = 10;
    user.global_experience += XP_AMOUNT;
    guildUser.experience += XP_AMOUNT;

    // Level up logic (global)
    const prevGlobalLevel = user.global_level;
    const newGlobalLevel = levelForXP(user.global_experience);
    if (newGlobalLevel > prevGlobalLevel) {
      user.global_level = newGlobalLevel;
      // Global level up message (optional)
      try {
        //await message.channel.send(`🌐 <@${discordUserId}> reached global level **${newGlobalLevel}**!`);
      } catch { }
    }

    // Level up logic (guild)
    const prevGuildLevel = guildUser.level;
    const newGuildLevel = levelForXP(guildUser.experience);
    if (newGuildLevel > prevGuildLevel) {
      guildUser.level = newGuildLevel;
      // Guild level up message (optional)
      try {
        //await message.channel.send(`🏠 <@${discordUserId}> reached level **${newGuildLevel}** in this server!`);
      } catch { }
    }

    await user.save();
    await guildUser.save();
  });

  // --- Slash Command: /xp ---
  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'xp') {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      let user = await User.findOne({ where: { discord_user_id: targetUser.id } });
      if (!user) {
        user = await User.create({ discord_user_id: targetUser.id });
      }
      let guildUser = await GuildUser.findOne({ where: { user_id: user.id, guild_id: interaction.guildId } });
      if (!guildUser) {
        guildUser = await GuildUser.create({ user_id: user.id, guild_id: interaction.guildId });
      }

      const globalLevel = levelForXP(user.global_experience);
      const globalNextXP = xpForLevel(globalLevel);
      const guildLevel = levelForXP(guildUser.experience);
      const guildNextXP = xpForLevel(guildLevel);

      const embed = new EmbedBuilder()
        .setTitle(`${targetUser.username.replace(/\b\w/g, c => c.toUpperCase())}'s XP Stats`)
        .addFields(
            {
            name: '🌐 Global',
            value:
                `XP: **${user.global_experience}**\n` +
                `Level: **${globalLevel}** (${user.global_experience}/${globalNextXP})\n` +
                formatXPBar(user.global_experience, globalNextXP),
            inline: false
            },
            {
            name: '🏠 This Server',
            value:
                `XP: **${guildUser.experience}**\n` +
                `Level: **${guildLevel}** (${guildUser.experience}/${guildNextXP})\n` +
                formatXPBar(guildUser.experience, guildNextXP),
            inline: false
            }
        )
        .setColor('#3498db');
        return interaction.reply({ embeds: [embed] });
    }
    // --- Slash Command: /leaderboard ---
    if (interaction.commandName === 'leaderboard') {
      const top = await GuildUser.findAll({
        where: { guild_id: interaction.guildId },
        order: [['experience', 'DESC']],
        limit: 10,
        include: [{ model: User }]
      });

      if (!top.length) {
        return interaction.reply({ content: 'No leaderboard data for this server yet.', flags: 1 << 6 });
      }

      const leaderboard = await Promise.all(top.map(async (gu, i) => {
        // Try to get the current username (may be undefined for left users)
        let displayName = `<@${gu.User.discord_user_id}>`;
        return `**${i + 1}.** ${displayName} — ${gu.experience} XP (Lvl ${levelForXP(gu.experience)})`;
      }));

      const serverName = interaction.guild?.name || "Server";
        const embed = new EmbedBuilder()
        .setTitle(`${serverName} Leaderboard 🏆`)
        .setDescription(leaderboard.join('\n'))
        .setColor('#e67e22');
        return interaction.reply({ embeds: [embed] });
    }
  });
}

module.exports = { commands, init };
