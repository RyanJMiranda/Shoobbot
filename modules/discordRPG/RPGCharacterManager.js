const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const RPGAttribute = require('../../database/models/discordRPG/RPGAttribute');
const RPGRace = require('../../database/models/discordRPG/RPGRace');
const RPGClass = require('../../database/models/discordRPG/RPGClass');
const RPGCharacter = require('../../database/models/discordRPG/RPGCharacter');
const RPGItem = require('../../database/models/discordRPG/RPGItem');
const { rollStat4d6DropLowest, calculateStatTotals, formatItem } = require('./RPGUtils');
const RPGInventory = require('../../database/models/discordRPG/RPGInventory');

async function buildCommands() {
  const raceRecords = await RPGRace.findAll();
  const classRecords = await RPGClass.findAll();

  const raceChoices = raceRecords.map(r => ({
    name: r.title || (r.key.charAt(0).toUpperCase() + r.key.slice(1)),
    value: r.key
  }));
  const classChoices = classRecords.map(c => ({
    name: c.title || (c.key.charAt(0).toUpperCase() + c.key.slice(1)),
    value: c.key
  }));

  return [
    new SlashCommandBuilder()
      .setName('createcharacter')
      .setDescription('Begin your RPG journey! Creates a new character profile.')
      .toJSON(),
    new SlashCommandBuilder()
      .setName('profile')
      .setDescription('Pull up your RPG profile (or another players!)')
      .addUserOption(opt =>
        opt.setName('user')
          .setDescription('Whose Profile?')
          .setRequired(false))
      .toJSON(),
    new SlashCommandBuilder()
      .setName('setrace')
      .setDescription('Set your RPG character\'s race. This is a permanent decision.')
      .addStringOption(opt =>
        opt.setName('race')
          .setDescription('Pick your race')
          .setRequired(true)
          .addChoices(...raceChoices))
      .toJSON(),
    new SlashCommandBuilder()
      .setName('setclass')
      .setDescription('Set your RPG character\'s class. This is a permanent decision.')
      .addStringOption(opt =>
        opt.setName('class')
          .setDescription('Pick your class')
          .setRequired(true)
          .addChoices(...classChoices))
      .toJSON(),
    new SlashCommandBuilder()
      .setName('rollstats')
      .setDescription('Roll your stats (4d6 drop lowest for each stat)')
      .toJSON(),
  ];
}

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
        return interaction.reply({ content: "You already have an RPG character! Do `/profile` to see!", flags: 1 << 6 });
      }
      const character = await RPGCharacter.create({
        user_id: user.id,
        race: 'human',
        class: 'adventurer',
        strength: 10, dexterity: 10, constitution: 10,
        intelligence: 10, wisdom: 10, charisma: 10,
      });

      await RPGInventory.create({
        character_id: character.id
      });

      return interaction.reply({
        content:
            "🎲 Your RPG character has been created!\n" +
            "Race: **Human**, Class: **Adventurer**\n\n" +
            "📊 **Statistics:**\n" +
            "💪 Strength: 10\n" +
            "🤸 Dexterity: 10\n" +
            "❤️ Constitution: 10\n" +
            "🧠 Intelligence: 10\n" +
            "🦉 Wisdom: 10\n" +
            "🎭 Charisma: 10\n\n" +
            "Next steps:\n• `/setrace`\n• `/setclass`\n• `/rollstats`",
        flags: 1 << 6
        });
    }

    if (interaction.commandName === 'profile') {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        // Find the associated User record (to get global_level)
        let user = await User.findOne({ where: { discord_user_id: targetUser.id } });
        if (!user) {
            return interaction.reply({ content: "No user profile found. Try gaining XP first!", flags: 1 << 6 });
        }
        // Find their RPG character
        let character = await RPGCharacter.findOne({ where: { user_id: user.id } });
        if (!character) {
            return interaction.reply({ content: "Create your character first with `/createcharacter`.", flags: 1 << 6 });
        }
        let raceObj = character.race ? await RPGRace.findOne({ where: { key: character.race } }) : null;
        let classObj = character.class ? await RPGClass.findOne({ where: { key: character.class } }) : null;

        const raceInfo = raceObj
          ? `**${raceObj.title}** — *${raceObj.description}*\nRacial Bonus: **${raceObj.bonus_title}** (+1 ${raceObj.bonus_attribute}, -1 ${raceObj.malus_attribute})`
          : "Unknown";

        const classInfo = classObj
          ? `**${classObj.title}** — *${classObj.description}*\nMain Stat: **${classObj.primary_attribute}**\nWeapon: **${classObj.preferred_weapon_type}**, Armour: **${classObj.preferred_armour_class}**`
          : "Unknown";

        const [weaponItem, armourItem, accessory1Item, accessory2Item] = await Promise.all([
          character.weapon_id ? RPGItem.findByPk(character.weapon_id) : null,
          character.armour_id ? RPGItem.findByPk(character.armour_id) : null,
          character.accessory1_id ? RPGItem.findByPk(character.accessory1_id) : null,
          character.accessory2_id ? RPGItem.findByPk(character.accessory2_id) : null,
        ]);

        const items = {
          Weapon: formatItem(weaponItem),
          Armour: formatItem(armourItem),
          Accessory1: formatItem(accessory1Item),
          Accessory2: formatItem(accessory2Item),
        };


        const totals = await calculateStatTotals(character, raceObj, {
          weapon: await RPGItem.findByPk(character.weapon_id),
          armour: await RPGItem.findByPk(character.armour_id),
          accessory1: await RPGItem.findByPk(character.accessory1_id),
          accessory2: await RPGItem.findByPk(character.accessory2_id)
        });

        const statsDisplay = Object.values(totals)
          .map(stat =>
            `${stat.emoji} **${stat.label}:** ${stat.total} ` +
            `(Base: ${stat.base}` +
            (stat.raceBonus ? `, Race: ${stat.raceBonus > 0 ? '+' : ''}${stat.raceBonus}` : '') +
            (stat.itemBonus ? `, Item: ${stat.itemBonus > 0 ? '+' : ''}${stat.itemBonus}` : '') +
            `)`
          ).join('\n');

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle(`${targetUser.username}'s Character Sheet`)
            .setColor('#f1c40f')
            .addFields([
            {
              name: 'Race',
              value: raceInfo,
              inline: false,
            },
            {
              name: 'Class',
              value: classInfo,
              inline: false,
            },
            {
                name: 'Equipped Items',
                value: [
                `🗡️ Weapon: ${items.Weapon}`,
                `🛡️ Armour: ${items.Armour}`,
                `💍 Accessory 1: ${items.Accessory1}`,
                `💍 Accessory 2: ${items.Accessory2}`
                ].join('\n'),
                inline: false,
            },
            {
              name: 'Statistics',
              value: statsDisplay,
              inline: false,
            }
            ])
            .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
            .setFooter({ text: 'Discord RPG Profile by Shoobbot' });

        return interaction.reply({ embeds: [embed], flags: 1 << 6 });
        }

    // --- SET RACE ---
    if (interaction.commandName === 'setrace') {
      const race = interaction.options.getString('race');
      const raceObj = await RPGRace.findOne({ where: { key: race } });
      if (!raceObj) {
        return interaction.reply({ content: "Invalid race!", flags: 1 << 6 });
      }
      let character = await RPGCharacter.findOne({ where: { user_id: user.id } });
      if (!character) {
        return interaction.reply({ content: "Create your character first with `/createcharacter`.", flags: 1 << 6 });
      }
      if(character.race !== 'human'){
        return interaction.reply({ content: `You already chose your characters race: ${character.race}`, flags: 1 << 6 });
      }
      character.race = race;
      await character.save();
      return interaction.reply({ content: `Your race is now **${race.charAt(0).toUpperCase() + race.slice(1)}**!`, flags: 1 << 6 });
    }

    // --- SET CLASS ---
    if (interaction.commandName === 'setclass') {
      const charClass = interaction.options.getString('class');
      const classObj = await RPGClass.findOne({ where: { key: charClass } });
      if (!classObj) {
        return interaction.reply({ content: "Invalid class!", flags: 1 << 6 });
      }
      let character = await RPGCharacter.findOne({ where: { user_id: user.id } });
      if (!character) {
        return interaction.reply({ content: "Create your character first with `/createcharacter`.", flags: 1 << 6 });
      }
      if(character.class !== 'adventurer'){
        return interaction.reply({ content: `You already chose your characters class: ${character.class}`, flags: 1 << 6 });
      }
      character.class = charClass;
      await character.save();
      return interaction.reply({ content: `Your class is now **${charClass.charAt(0).toUpperCase() + charClass.slice(1)}**!`, flags: 1 << 6 });
    }

    // --- ROLL STATS ---
    if (interaction.commandName === 'rollstats') {
      let character = await RPGCharacter.findOne({ where: { user_id: user.id } });
      if (!character) {
        return interaction.reply({ content: "Create your character first with `/createcharacter`.", flags: 1 << 6 });
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
      return interaction.reply({ embeds: [embed], flags: 1 << 6 });
    }
  });
}

module.exports = { buildCommands, init };
