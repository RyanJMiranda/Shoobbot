const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');
const Poll = require('../database/models/Poll'); // <--- Adjust path as needed
const { Op } = require('sequelize');

require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a reaction poll')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel to post the poll in')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('title')
        .setDescription('Poll Title')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('duration')
        .setDescription('How long the poll should run in hours (e.g. 0.5 for 30 minutes)')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('option1')
        .setDescription('First poll option label')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('option2')
        .setDescription('Second poll option label')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('option3')
        .setDescription('Third poll option label')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('option4')
        .setDescription('Fourth poll option label')
        .setRequired(false))
    .addBooleanOption(opt =>
      opt.setName('single_vote')
        .setDescription('Allow only single vote per user? (Default: No)')
        .setRequired(false)
    )
    .toJSON()
];

const regionalIndicators = ['🇦', '🇧', '🇨', '🇩'];

const reactionProcessing = new Set();

function init(client){

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'poll') return;

    const pollChannel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const singleVote = interaction.options.getBoolean('single_vote') ?? false;
    const options = [];
    for (let i = 1; i <= 4; i++) {
      const label = interaction.options.getString(`option${i}`);
      if (label) options.push(label);
    }
    if (options.length < 2) {
      return interaction.reply({ content: '❌ At least 2 options are required.', flags: 1 << 6 });
    }

    // Duration as float (hours)
    const durationStr = interaction.options.getString('duration');
    const durationHours = parseFloat(durationStr);
    if (isNaN(durationHours) || durationHours <= 0) {
      return interaction.reply({ content: '❌ Invalid duration.', flags: 1 << 6 });
    }
    const endTime = new Date(Date.now() + durationHours * 3600000);

    // Build poll embed
    let description = '';
    for (let i = 0; i < options.length; i++) {
      description += `${regionalIndicators[i]} **${options[i]}**\n`;
    }
    if (singleVote){
      description += `\n\nThis Poll Allows Only One Vote Per Person`;
    }
    description += `\n⏰ **Poll ends:** <t:${Math.floor(endTime.getTime() / 1000)}:R>`;

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${title}`)
      .setDescription(description)
      .setColor('#3498db')
      .setFooter({ text: `Poll created by ${interaction.user.tag}` })
      .setTimestamp();

    


    try {
      // Post the poll and react
      const pollMsg = await pollChannel.send({ embeds: [embed] });
      for (let i = 0; i < options.length; i++) {
        await pollMsg.react(regionalIndicators[i]);
      }

      // Save poll to DB for future tallying
      await Poll.create({
        guild_id: interaction.guildId,
        channel_id: pollChannel.id,
        message_id: pollMsg.id,
        title: title,
        options: options.map((label, i) => ({ emoji: regionalIndicators[i], label })),
        ends_at: endTime,
        created_by: interaction.user.id,
        single_vote: singleVote, 
      });

      await interaction.reply({ content: `✅ Poll posted in ${pollChannel}`, flags: 1 << 6 });
    } catch (err) {
      console.error('[Poll] Failed to post or save poll:', err);
      await interaction.reply({ content: '❌ Failed to post poll. (Check bot permissions and DB)', flags: 1 << 6 });
    }
  });

  client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    const key = `${reaction.message.id}:${user.id}`;
    if (reactionProcessing.has(key)) return;
    reactionProcessing.add(key);
    try {
      // (Handle partials as before if needed)
      const poll = await Poll.findOne({
        where: {
          message_id: reaction.message.id,
          closed: false
        }
      });
      if (!poll || !poll.single_vote) return;
  
      const pollEmojis = poll.options.map(opt => opt.emoji);
      if (!pollEmojis.includes(reaction.emoji.name)) return;
  
      for (const emoji of pollEmojis) {
        if (emoji === reaction.emoji.name) continue;
        const otherReaction = reaction.message.reactions.cache.get(emoji);
        if (otherReaction) {
          await otherReaction.users.fetch();
          const hasUser = otherReaction.users.cache.has(user.id);
          if (hasUser) {
            await otherReaction.users.remove(user.id);
            try {
              await user.send(
                `You can only vote for one option in **"${poll.title}"**. Your previous vote was removed in favor of your new choice.`
              );
            } catch (e) {}
          }
        }
      }
    } finally {
      // Brief delay to avoid instant double-handling
      setTimeout(() => reactionProcessing.delete(key), 100);
    }
  });
  

  setInterval(async () => {
    const now = new Date();
    const pollsToClose = await Poll.findAll({
      where: {
        ends_at: { [Op.lt]: now },
        closed: false
      }
    });
  
    if (pollsToClose.length > 0) {
      console.log(`[Poll] Found ${pollsToClose.length} poll(s) to close at ${now.toISOString()}`);
    }
  
    for (const poll of pollsToClose) {
      try {
        console.log(`[Poll] Reviewing poll ID ${poll.id} titled "${poll.title}" (msg: ${poll.message_id})`);
        const channel = await client.channels.fetch(poll.channel_id);
        const message = await channel.messages.fetch(poll.message_id);
  
        // Tally votes
        let highest = 0;
        let winners = [];
        const tally = {};
        for (const opt of poll.options) {
          const reaction = message.reactions.cache.get(opt.emoji);
          let count = 0;
          if (reaction) {
            const users = await reaction.users.fetch();
            count = users.filter(u => !u.bot).size;
            console.log(`[Poll] Option "${opt.label}" (${opt.emoji}): ${users.size} total, ${count} (user votes)`);
          } else {
            console.log(`[Poll] Option "${opt.label}" (${opt.emoji}): 0 total, 0 (user votes)`);
          }
          tally[opt.label] = count;
          if (count > highest) {
            highest = count;
            winners = [opt.emoji];
          } else if (count === highest && count > 0) {
            winners.push(opt.emoji);
          }
        }
        
  
        // Prepare result string
        let resultText;
        if (highest === 0) {
          resultText = 'No votes were cast.';
        } else if (winners.length === 1) {
          resultText = `🏆 **Winner:** ${winners[0]} with ${highest} vote${highest === 1 ? '' : 's'}`;
        } else {
          resultText = `🏆 **Winners (tie):** ${winners.join(' / ')} (${highest} vote${highest === 1 ? '' : 's'} each)`;
        }
  
        // Edit the embed
        const oldEmbed = message.embeds[0];
        const newEmbed = EmbedBuilder.from(oldEmbed)
          .setColor('#e74c3c')
          .setDescription(`${oldEmbed.description}\n\n**Poll ended!**\n${resultText}`)
          .setFooter({ text: 'Poll closed' });
  
        await message.edit({ embeds: [newEmbed], components: [] });
        await message.reactions.removeAll();
  
        // Update poll in DB
        poll.closed = true;
        poll.results = tally;
        await poll.save();
  
        console.log(`[Poll] Poll ID ${poll.id} closed and results saved:`, tally);
  
      } catch (err) {
        console.error('[Poll][Scheduler] Failed to tally poll:', err);
      }
    }
  }, 60 * 1000); // every minute
  
}

module.exports = { commands, init };
