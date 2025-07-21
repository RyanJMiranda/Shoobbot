// modules/discordRPG/RPGAdventureManager.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../../database/models/User');
const RPGCharacter = require('../../database/models/discordRPG/RPGCharacter');
const RPGAdventure = require('../../database/models/discordRPG/RPGAdventure');
const RPGMonster = require('../../database/models/discordRPG/RPGMonster');
const RPGInventory = require('../../database/models/discordRPG/RPGInventory');
const RPGInventorySlot = require('../../database/models/discordRPG/RPGInventorySlot');
const GuildUser = require('../../database/models/GuildUser');

const { getQualifyingAdventures, skillCheck, isOnCooldown, setCooldown } = require('./helpers/adventure_helper');
const { startCombatEncounter } = require('./helpers/combat_helper');
const { formatMoney } = require('./RPGInventoryManager');

// Adventure cooldown in seconds (can be env or config)
const ADVENTURE_COOLDOWN_SEC = 15;
const ADVENTURE_FAIL_COOLDOWN_SEC = 60;

async function buildCommands() {
    return [
    new SlashCommandBuilder()
        .setName('adventure')
        .setDescription('Go on a new RPG adventure!')
        .toJSON()
    ];
}

async function awardRewards(character, user, goldAwarded, xpAwarded, itemAwarded, guildId) {
  // Add gold to inventory
  const inventory = await RPGInventory.findOne({ where: { character_id: character.id } });
  if (inventory && goldAwarded) {
    inventory.money += goldAwarded;
    await inventory.save();
  }

  // Add XP to User (global)
  if (xpAwarded) {
    user.global_experience += xpAwarded;
    await user.save();
  }

  // Add XP to GuildUser (per guild)
  if (guildId) {
    const GuildUser = require('../../database/models/GuildUser');
    let guildUser = await GuildUser.findOne({ where: { user_id: user.id, guild_id: guildId } });
    if (guildUser) {
      guildUser.experience += xpAwarded;
      await guildUser.save();
    }
  }

  // Add item to inventory
  if (inventory && itemAwarded) {
    // Find first empty slot
    let emptySlot = await RPGInventorySlot.findOne({ 
      where: { inventory_id: inventory.id, item_id: null }
    });
    if (emptySlot) {
      emptySlot.item_id = itemAwarded.id;
      emptySlot.quantity = 1;
      await emptySlot.save();
    } else {
      
    }
  }
}

function init(client) {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'adventure') return;

    const userId = interaction.user.id;
    let user = await User.findOne({ where: { discord_user_id: userId } });
    if (!user) user = await User.create({ discord_user_id: userId });
    let character = await RPGCharacter.findOne({ where: { user_id: user.id } });
    if (!character) {
      return interaction.reply({ content: 'Create your character with `/createcharacter` first!', flags: 1 << 6 });
    }

    // --- Cooldown check
    if (await isOnCooldown(user.id, ADVENTURE_COOLDOWN_SEC)) {
      // Show cozy campfire embed if on cooldown
      const embed = new EmbedBuilder()
        .setTitle("⛺ You're resting by the campfire...")
        .setDescription("You’re too tired to adventure again so soon! \n\n_\"Sometimes, the greatest journeys start with a good rest.\"_ 💤")
        .setColor('#fabd2f')
        .setThumbnail("https://emoji.discadia.com/emojis/407b41f4-3b92-46b2-be37-f287061c2d91.PNG"); // campfire emoji or image
      return interaction.reply({ embeds: [embed], flags: 1 << 6 });
    }

    // --- Get all adventures user qualifies for
    const adventures = await getQualifyingAdventures(character);
    if (!adventures.length) {
      return interaction.reply({ content: 'No adventures are available for your level/stats yet.', flags: 1 << 6 });
    }

    // --- Pick a random adventure
    const adventure = adventures[Math.floor(Math.random() * adventures.length)];
    // --- Stat requirement / Skill check
    let passedSkillCheck = true;
    let skillCheckResult = null;
    if (adventure.required_stats) {
      skillCheckResult = skillCheck(character, adventure);
      passedSkillCheck = skillCheckResult.success;
    }

    if (adventure.monster_ids) {
    // Start combat sequence (embed + buttons)
    console.log('Starting Combat Sequence For ' + character.user_id)
    return startCombatEncounter(client, interaction, { character, monsterId: adventure.monster_ids });
    }

    // --- Non-combat Adventure Resolution
    let embed = new EmbedBuilder()
      .setTitle(`🌟 Adventure: ${adventure.title}`)
      .setDescription(adventure.description)
      .setColor(passedSkillCheck ? '#27ae60' : '#e74c3c')
      .setFooter({ text: passedSkillCheck ? 'Success!' : 'Failed the skill check...' });

    // money & XP calculation
    let moneyAwarded = 0;
    let xpAwarded = 0;
    let itemAwarded = null;

    if (passedSkillCheck) {
      moneyAwarded = getMoneyAward(adventure);
      xpAwarded = getXPAward(adventure);
      itemAwarded = null;
      await awardRewards(character, user, moneyAwarded, xpAwarded, itemAwarded, interaction.guildId);
      embed.addFields([
        { name: 'Loot', value: `💰 +${moneyAwarded}\n✨ +${xpAwarded} XP` }
      ]);
    } else {
      // Optionally, partial rewards or fail
      moneyAwarded = 0; xpAwarded = 0;
      embed.addFields([{ name: 'Outcome', value: "You didn’t meet the requirements. Try again next time!" }]);
    }

    // Set user cooldown
    await setCooldown(user.id, ADVENTURE_COOLDOWN_SEC, adventure.id);

    // Respond
    return interaction.reply({ embeds: [embed]});
  });
}

function getMoneyAward(adventure) {
  if (!adventure.gold_min || !adventure.gold_max) return 0;
  const min = Math.floor(adventure.gold_min);
  const max = Math.floor(adventure.gold_max);
  return getFromRange(min, max);
}

function getXPAward(adventure) {
  if (!adventure.xp_min || !adventure.xp_max) return 0;
  const min = Math.floor(adventure.xp_min);
  const max = Math.floor(adventure.xp_max);
  return getFromRange(min, max);
}

function getFromRange(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = { buildCommands, init };