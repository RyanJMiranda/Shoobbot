const sequelize = require('../../utils/sequelize');
const RPGClass = require('../models/discordRPG/RPGClass');

const classes = [
  {
    key: 'warrior',
    title: 'Warrior',
    description: 'Frontline fighters who excel with weapons and heavy armor.',
    primary_attribute: 'strength',
    preferred_weapon_type: 'sword',
    preferred_armour_class: 'heavy'
  },
  {
    key: 'rogue',
    title: 'Rogue',
    description: 'Masters of stealth and surprise, striking where least expected.',
    primary_attribute: 'dexterity',
    preferred_weapon_type: 'dagger',
    preferred_armour_class: 'light'
  },
  {
    key: 'paladin',
    title: 'Paladin',
    description: 'Holy knights who blend martial skill and divine power.',
    primary_attribute: 'charisma',
    preferred_weapon_type: 'mace',
    preferred_armour_class: 'heavy'
  },
  {
    key: 'monk',
    title: 'Monk',
    description: 'Martial artists with discipline and spiritual focus.',
    primary_attribute: 'wisdom',
    preferred_weapon_type: 'staff',
    preferred_armour_class: 'light'
  },
  {
    key: 'thief',
    title: 'Thief',
    description: 'Experts in locks, traps, and clever trickery.',
    primary_attribute: 'dexterity',
    preferred_weapon_type: 'dagger',
    preferred_armour_class: 'light'
  },
  {
    key: 'bard',
    title: 'Bard',
    description: 'Inspirational performers who weave magic with music.',
    primary_attribute: 'charisma',
    preferred_weapon_type: 'lute',
    preferred_armour_class: 'medium'
  },
  {
    key: 'mage',
    title: 'Mage',
    description: 'Arcane spellcasters with a deep well of magical knowledge.',
    primary_attribute: 'intelligence',
    preferred_weapon_type: 'staff',
    preferred_armour_class: 'light'
  },
  {
    key: 'ranger',
    title: 'Ranger',
    description: 'Skilled hunters and trackers, deadly from afar.',
    primary_attribute: 'dexterity',
    preferred_weapon_type: 'bow',
    preferred_armour_class: 'medium'
  },
  {
    key: 'priest',
    title: 'Priest',
    description: 'Healers and protectors who channel divine energy.',
    primary_attribute: 'wisdom',
    preferred_weapon_type: 'mace',
    preferred_armour_class: 'medium'
  },
  {
    key: 'druid',
    title: 'Druid',
    description: 'Nature\'s guardians, able to shapeshift and command the elements.',
    primary_attribute: 'wisdom',
    preferred_weapon_type: 'staff',
    preferred_armour_class: 'medium'
  },
  {
    key: 'warlock',
    title: 'Warlock',
    description: 'Wielders of forbidden pacts and dark powers.',
    primary_attribute: 'charisma',
    preferred_weapon_type: 'wand',
    preferred_armour_class: 'light'
  },
];

(async () => {
  await sequelize.sync();
  for (const klass of classes) {
    await RPGClass.upsert(klass);
    console.log(`Seeded class: ${klass.title}`);
  }
  process.exit();
})();
