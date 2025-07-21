const sequelize = require('../../utils/sequelize');
const RPGRace = require('../models/RPGRace');

const races = [
  {
    key: 'elf',
    title: 'Elf',
    description: 'Graceful and wise, elves excel in archery and magic.',
    bonus_attribute: 'dexterity',
    bonus_title: 'Elven Agility',
    malus_attribute: 'constitution',
  },
  {
    key: 'dwarf',
    title: 'Dwarf',
    description: 'Stout and tough, dwarves are skilled craftsmen and resilient warriors.',
    bonus_attribute: 'constitution',
    bonus_title: 'Dwarven Resilience',
    malus_attribute: 'charisma',
  },
  {
    key: 'gnome',
    title: 'Gnome',
    description: 'Inventive and clever, gnomes have a knack for tinkering and illusions.',
    bonus_attribute: 'intelligence',
    bonus_title: 'Gnomish Ingenuity',
    malus_attribute: 'strength',
  },
  {
    key: 'orc',
    title: 'Orc',
    description: 'Fierce and powerful, orcs value might and bravery above all.',
    bonus_attribute: 'strength',
    bonus_title: 'Orcish Strength',
    malus_attribute: 'wisdom',
  },
  {
    key: 'troll',
    title: 'Troll',
    description: 'Tall and regenerating, trolls are wild and unpredictable.',
    bonus_attribute: 'constitution',
    bonus_title: 'Troll Regeneration',
    malus_attribute: 'intelligence',
  },
  {
    key: 'giant',
    title: 'Giant',
    description: 'Enormous beings with great physical power but slow minds.',
    bonus_attribute: 'strength',
    bonus_title: 'Giant\'s Might',
    malus_attribute: 'dexterity',
  },
  {
    key: 'undead',
    title: 'Undead',
    description: 'Resilient to pain, undead persist where others would fall.',
    bonus_attribute: 'wisdom',
    bonus_title: 'Undying Resolve',
    malus_attribute: 'charisma',
  },
  {
    key: 'dragonkin',
    title: 'Dragonkin',
    description: 'Descendants of dragons, they possess magical power and pride.',
    bonus_attribute: 'charisma',
    bonus_title: 'Draconic Presence',
    malus_attribute: 'dexterity',
  },
];

(async () => {
  await sequelize.sync();
  for (const race of races) {
    await RPGRace.upsert(race);
    console.log(`Seeded race: ${race.title}`);
  }
  process.exit();
})();
