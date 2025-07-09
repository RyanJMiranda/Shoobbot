const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const RPGCharacter = require('../../database/models/RPGCharacter');
const { rollStat4d6DropLowest } = require('./RPGUtils');

const RACES = ['human', 'elf', 'dwarf', 'gnome', 'orc', 'troll', 'giant', 'undead', 'dragonkin'];
const CLASSES = ['warrior', 'rogue', 'paladin', 'monk', 'thief', 'bard', 'mage', 'ranger', 'priest', 'druid', 'warlock'];

const commands = [
  new SlashCommandBuilder()
    .setName('createcharacter')
    .setDescription('Begin your RPG journey! Creates a new character profile.')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('setrace')
    .setDescription('Set your RPG character\'s race')
    .addStringOption(opt =>
      opt.setName('race')
        .setDescription('Pick your race')
        .setRequired(true)
        .addChoices(...RACES.map(r => ({ name: r.charAt(0).toUpperCase() + r.slice(1), value: r }))))
    .toJSON(),
  new SlashCommandBuilder()
    .setName('setclass')
    .setDescription('Set your RPG character\'s class')
    .addStringOption(opt =>
      opt.setName('class')
        .setDescription('Pick your class')
        .setRequired(true)
        .addChoices(...CLASSES.map(c => ({ name: c.charAt(0).toUpperCase() + c.slice(1), value: c }))))
    .toJSON(),
  new SlashCommandBuilder()
    .setName('rollstats')
    .setDescription('Roll your stats (4d6 drop lowest for each stat)')
    .toJSON(),
];

function init(client) {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const userId = interaction.user.id;
    let user = await User.findOne({ where: { discord_user_id: userId } });
    if (!user) user = await User.create({ discord_user_id: userId });

    // --- CREATE CHARACTER ---
    if (interaction.commandName === 'createcharacter') {
      let existing = await RPGCharacter.findOne({ where: { user_id: user.id } });
      if (existing) {
        return interaction.reply({ content: "You already have an RPG character!", ephemeral: true });
      }
      await RPGCharacter.create({
        user_id: user.id,
        race: 'human',
        class: 'adventurer',
        strength: 10, dexterity: 10, constitution: 10,
        intelligence: 10, wisdom: 10, charisma: 10,
      });
      return interaction.reply({
        content:
          "🎲 Your RPG character has been created!\n" +
          "Race: **Human**, Class: **Adventurer**, All stats start at 10.\n" +
          "Next steps:\n• `/setrace`\n• `/setclass`\n• `/rollstats`",
        ephemeral: true
      });
    }

    // --- SET RACE ---
    if (interaction.commandName === 'setrace') {
      const race = interaction.options.getString('race');
      if (!RACES.includes(race)) {
        return interaction.reply({ content: "Invalid race!", ephemeral: true });
      }
      let character = await RPGCharacter.findOne({ where: { user_id: user.id } });
      if (!character) {
        return interaction.reply({ content: "Create your character first with `/createcharacter`.", ephemeral: true });
      }
      character.race = race;
      await character.save();
      return interaction.reply({ content: `Your race is now **${race.charAt(0).toUpperCase() + race.slice(1)}**!`, ephemeral: true });
    }

    // --- SET CLASS ---
    if (interaction.commandName === 'setclass') {
      const charClass = interaction.options.getString('class');
      if (!CLASSES.includes(charClass)) {
        return interaction.reply({ content: "Invalid class!", ephemeral: true });
      }
      let character = await RPGCharacter.findOne({ where: { user_id: user.id } });
      if (!character) {
        return interaction.reply({ content: "Create your character first with `/createcharacter`.", ephemeral: true });
      }
      character.class = charClass;
      await character.save();
      return interaction.reply({ content: `Your class is now **${charClass.charAt(0).toUpperCase() + charClass.slice(1)}**!`, ephemeral: true });
    }

    // --- ROLL STATS ---
    if (interaction.commandName === 'rollstats') {
      let character = await RPGCharacter.findOne({ where: { user_id: user.id } });
      if (!character) {
        return interaction.reply({ content: "Create your character first with `/createcharacter`.", ephemeral: true });
      }
      // Roll stats for each
      const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
      let results = {};
      for (const stat of stats) {
        results[stat] = rollStat4d6DropLowest();
        character[stat] = results[stat];
      }
      await character.save();

      // Respond with an embed showing stats
      const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username}'s RPG Character Stats`)
        .addFields(stats.map(stat => ({
          name: stat.charAt(0).toUpperCase() + stat.slice(1),
          value: String(results[stat]),
          inline: true
        })))
        .setColor('#8e44ad')
        .setFooter({ text: "Good luck on your adventure!" });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  });
}

module.exports = { commands, init };
