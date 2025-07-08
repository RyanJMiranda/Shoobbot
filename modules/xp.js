const { SlashCommandBuilder } = require('discord.js');
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

    // Cooldown: 60 seconds per user per guild
    if (cooldown.has(key) && now - cooldown.get(key) < 60000) return;
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
        return interaction.reply({ content: `No XP found for ${targetUser.tag}.`, ephemeral: true });
      }
      let guildUser = await GuildUser.findOne({ where: { user_id: user.id, guild_id: interaction.guildId } });
      if (!guildUser) {
        return interaction.reply({ content: `No XP found for ${targetUser.tag} in this server.`, ephemeral: true });
      }

      const globalLevel = levelForXP(user.global_experience);
      const globalNextXP = xpForLevel(globalLevel);
      const guildLevel = levelForXP(guildUser.experience);
      const guildNextXP = xpForLevel(guildLevel);

      return interaction.reply({
        content:
          `**XP Stats for <@${targetUser.id}>**\n\n` +
          `🌐 **Global:** ${user.global_experience} XP\n` +
          `Level ${globalLevel} (${user.global_experience}/${globalNextXP})\n` +
          formatXPBar(user.global_experience, globalNextXP) + '\n\n' +
          `🏠 **This Server:** ${guildUser.experience} XP\n` +
          `Level ${guildLevel} (${guildUser.experience}/${guildNextXP})\n` +
          formatXPBar(guildUser.experience, guildNextXP),
        flags: 1 << 6
      });
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

      return interaction.reply({
        content: `🏆 **Server XP Leaderboard**\n\n${leaderboard.join('\n')}`,
        flags: 1 << 6
      });
    }
  });
}

module.exports = { commands, init };
