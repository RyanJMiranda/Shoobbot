const sequelize = require('../../utils/sequelize');
const RPGAttribute = require('../models/RPGAttribute');

const attributes = [
  {
    key: 'strength',
    label: 'Strength',
    emoji: '💪',
    description: 'Physical power, governs melee damage and carrying capacity.'
  },
  {
    key: 'dexterity',
    label: 'Dexterity',
    emoji: '🤸',
    description: 'Agility and reflexes, affects accuracy and evasion.'
  },
  {
    key: 'constitution',
    label: 'Constitution',
    emoji: '❤️',
    description: 'Endurance and health. Higher constitution increases HP and resistances.'
  },
  {
    key: 'intelligence',
    label: 'Intelligence',
    emoji: '🧠',
    description: 'Mental acuity, affects magic damage and spell slots.'
  },
  {
    key: 'wisdom',
    label: 'Wisdom',
    emoji: '🦉',
    description: 'Perception and willpower, affects resistances and healing.'
  },
  {
    key: 'charisma',
    label: 'Charisma',
    emoji: '🎭',
    description: 'Charm and leadership. Affects persuasion and social interactions.'
  },
];

(async () => {
  await sequelize.sync(); // Just in case
  for (const attr of attributes) {
    await RPGAttribute.upsert(attr); // Upsert for idempotence
    console.log(`Seeded attribute: ${attr.label}`);
  }
  process.exit();
})();
