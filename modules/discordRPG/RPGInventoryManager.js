const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../database/models/User');
const RPGCharacter = require('../../database/models/discordRPG/RPGCharacter');
const RPGInventory = require('../../database/models/discordRPG/RPGInventory');
const RPGInventorySlot = require('../../database/models/discordRPG/RPGInventorySlot');
const RPGItem = require('../../database/models/discordRPG/RPGItem');

async function buildCommands() {
  return [
    new SlashCommandBuilder()
      .setName('viewinventory')
      .setDescription('View your RPG inventory')
      .toJSON(),
  ];
}

async function init(client) {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'viewinventory') {
      const userId = interaction.user.id;
      let user = await User.findOne({ where: { discord_user_id: userId } });
      if (!user) return interaction.reply({ content: "No profile found!", flags: 1 << 6 });
      let character = await RPGCharacter.findOne({ where: { user_id: user.id } });
      if (!character) return interaction.reply({ content: "No RPG character!", flags: 1 << 6 });
      let inventory = await RPGInventory.findOne({ where: { character_id: character.id } });
      if (!inventory) return interaction.reply({ content: "No inventory found!", flags: 1 << 6 });

      const slots = await RPGInventorySlot.findAll({
        where: { inventory_id: inventory.id },
        include: [RPGItem],
        order: [['slot_number', 'ASC']]
      });

      let desc = slots.map((slot, i) => {
        let itemStr = slot.RPGItem ? `**${slot.RPGItem.name}** x${slot.quantity}` : "Empty";
        return `Slot ${i + 1}: ${itemStr}${slot.locked ? ' 🔒' : ''}`;
      }).join('\n');

      let embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username}'s Inventory`)
        .setDescription(desc || 'No items.')
        .addFields([
          { name: 'Money', value: `${formatMoney(inventory.money)}`, inline: true }
        ])
        .setColor('#f39c12');
      return interaction.reply({ embeds: [embed], flags: 1 << 6 });
    }

    // TODO: implement dropitem, sellitem, etc...
  });
}

// Utility for displaying money
function formatMoney(copper) {
  const platinum = Math.floor(copper / 1000000);
  copper = copper % 1000000;
  const gold = Math.floor(copper / 10000);
  copper = copper % 10000;
  const silver = Math.floor(copper / 100);
  copper = copper % 100;
  let out = [];
  out.push(`:purse:`);
  if (platinum) out.push(`${platinum}p`);
  if (gold) out.push(`${gold}g`);
  if (silver) out.push(`${silver}s`);
  if (copper) out.push(`${copper}c`);
  return out.join(' ') || '0c';
}

module.exports = { buildCommands, formatMoney, init };
