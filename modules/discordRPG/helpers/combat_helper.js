const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const RPGMonster = require('../../../database/models/discordRPG/RPGMonster');
const RPGCharacter = require('../../../database/models/discordRPG/RPGCharacter');
const RPGItem = require('../../../database/models/discordRPG/RPGItem');
const RPGCombatEncounter = require('../../../database/models/discordRPG/RPGCombatEncounter');
const { calculateStatTotals } = require('../RPGUtils');

// Main entry point for starting a combat encounter
async function startCombatEncounter(client, interaction, { character, monsterId }) {
  // Fetch monster record
  const monster = await RPGMonster.findByPk(monsterId);
  if (!monster) {
    return interaction.reply({ content: "Monster not found! Tell @Shooberino", flags: 1 << 6 });
  }
  console.log('Fetched monster: ' + monster.name);

  await RPGCombatEncounter.update(
    { active: false },
    { where: { user_id: interaction.user.id, active: true } }
  );

  // Calculate player stats
  // (Optionally fetch items if needed, this is a placeholder)
  const statTotals = await calculateStatTotals(character, null, {});

  // Example hit/damage calculation (very basic, you'll want to improve this)
  const playerAttack = statTotals.strength?.total || 10;
  const monsterAttack = monster.attack || 5;
  const playerHP = 20 + (statTotals.constitution?.total || 0);
  const monsterHP = monster.hp || 10;

  // Create new encounter in DB
  const combat = await RPGCombatEncounter.create({
    user_id: interaction.user.id,
    character_id: character.id,
    monster_id: monster.id,
    player_hp: playerHP,
    player_max_hp: playerHP,
    monster_hp: monsterHP,
    monster_max_hp: monsterHP,
    turn_number: 1,
    combat_state: {},
    actions_log: '',
    active: true,
  });

  // Build combat embed
  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Combat: You vs ${monster.name}`)
    .setDescription(`**${monster.description || "A fearsome foe appears!"}**`)
    .addFields(
      { name: 'Your Stats', value: `HP: **${playerHP}**\nAttack: **${playerAttack}**`, inline: true },
      { name: `${monster.name} Stats`, value: `HP: **${monsterHP}**\nAttack: **${monsterAttack}**`, inline: true }
    )
    .setFooter({ text: 'Choose your action!' })
    .setColor('#d35400');

  // Action buttons
  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('combat_attack')
      .setLabel('Attack')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('combat_defend')
      .setLabel('Defend')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('combat_run')
      .setLabel('Run')
      .setStyle(ButtonStyle.Danger)
  );

  // Send the embed and buttons to the user
  await interaction.reply({
    embeds: [embed],
    components: [actionRow],
    flags: 1 << 6
  });

}

module.exports = {
  startCombatEncounter,
};
