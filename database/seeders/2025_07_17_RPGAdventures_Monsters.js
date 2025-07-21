const sequelize = require('../../utils/sequelize');
const RPGMonster = require('../models/discordRPG/RPGMonster');
const RPGAdventure = require('../models/discordRPG/RPGAdventure');

async function seedAll() {
  // Step 1: Seed monsters
    const monsters = [
    {
        name: 'Goblin',
        description: 'A small, mischievous creature with a knack for trouble.',
        base_level: 2,
        base_hp: 20,
        base_attack: 6,
        base_defense: 3,
        reward_exp: 15,
        reward_gold: 40,
        attributes: {
        strength: 8,
        dexterity: 13,
        constitution: 9,
        intelligence: 7,
        wisdom: 6,
        charisma: 5
        }
    },
    {
        name: 'Bandit',
        description: 'A cunning highwayman who preys on travelers.',
        base_level: 4,
        base_hp: 32,
        base_attack: 10,
        base_defense: 7,
        reward_exp: 30,
        reward_gold: 90,
        attributes: {
        strength: 12,
        dexterity: 14,
        constitution: 11,
        intelligence: 10,
        wisdom: 9,
        charisma: 8
        }
    },
    {
        name: 'Hero',
        description: 'A mysterious, powerful fighter with noble intentions.',
        base_level: 8,
        base_hp: 60,
        base_attack: 18,
        base_defense: 12,
        reward_exp: 65,
        reward_gold: 220,
        attributes: {
        strength: 16,
        dexterity: 14,
        constitution: 15,
        intelligence: 12,
        wisdom: 12,
        charisma: 13
        }
    }
    ];

  await sequelize.sync();

  // Insert or update monsters, get refs
  const monsterMap = {};
  for (const m of monsters) {
    const [monster] = await RPGMonster.upsert(m, { returning: true });
    monsterMap[m.name] = monster.id || (monster.dataValues ? monster.dataValues.id : undefined);
    console.log(`Seeded monster: ${m.name}`);
  }

  // Step 2: Retrieve monster IDs
  // (Redundant here, but shows intent. If you want to be sure, fetch again.)
  const goblin = monsterMap['Goblin'];
  const bandit = monsterMap['Bandit'];
  const hero = monsterMap['Hero'];

  // Step 3: Seed adventures
  const adventures = [
    // --- Non-combat adventures ---
    {
      title: "The Bridge of Sighs",
      description: "You encounter an ancient rope bridge swaying over a foggy gorge. Crossing safely will test your dexterity.",
      min_level: 1,
      max_level: 10,
      stat_requirements: { dexterity: 12 },
      monster_id: null,
      gold_min: 50,
      gold_max: 150,
      xp_min: 15,
      xp_max: 25
    },
    {
      title: "A Riddle in the Ruins",
      description: "In the ruins of an old tower, a stone tablet challenges you with a mind-bending riddle. Only the clever may pass.",
      min_level: 1,
      max_level: 10,
      stat_requirements: { intelligence: 13 },
      monster_id: null,
      gold_min: 40,
      gold_max: 120,
      xp_min: 15,
      xp_max: 30
    },
    {
      title: "The Old Woman's Request",
      description: "A mysterious old woman asks for your help to fetch water from a well. She insists only the strong can carry the bucket up the hill.",
      min_level: 1,
      max_level: 10,
      stat_requirements: { strength: 12 },
      monster_id: null,
      gold_min: 60,
      gold_max: 120,
      xp_min: 15,
      xp_max: 25
    },
    {
      title: "Court of Whispers",
      description: "You must charm your way past a suspicious city guard. Your silver tongue will be your best weapon.",
      min_level: 2,
      max_level: 15,
      stat_requirements: { charisma: 13 },
      monster_id: null,
      gold_min: 100,
      gold_max: 200,
      xp_min: 20,
      xp_max: 40
    },
    {
      title: "Test of the Ancient Oak",
      description: "An ancient talking oak tree asks you to answer a question about the meaning of life, testing your wisdom.",
      min_level: 3,
      max_level: 20,
      stat_requirements: { wisdom: 14 },
      monster_id: null,
      gold_min: 80,
      gold_max: 180,
      xp_min: 20,
      xp_max: 35
    },
    // --- Combat adventures (linked to monsters) ---
    {
      title: "Ambushed by Goblins!",
      description: "A band of goblins leaps from the shadows! Prepare for battle.",
      min_level: 1,
      max_level: 5,
      stat_requirements: { dexterity: 10 },
      monster_id: goblin,
      gold_min: 30,
      gold_max: 80,
      xp_min: 18,
      xp_max: 28
    },
    {
      title: "Roadside Bandit Attack",
      description: "A bandit springs out from behind the rocks, dagger gleaming!",
      min_level: 2,
      max_level: 8,
      stat_requirements: { dexterity: 10, strength: 10 },
      monster_id: bandit,
      gold_min: 70,
      gold_max: 160,
      xp_min: 22,
      xp_max: 36
    },
    {
      title: "Duel with the Mysterious Hero",
      description: "A wandering hero challenges you to a duel for honor. Do you accept?",
      min_level: 5,
      max_level: 20,
      stat_requirements: { strength: 13, charisma: 12 },
      monster_id: hero,
      gold_min: 200,
      gold_max: 400,
      xp_min: 50,
      xp_max: 90
    },
  ];

  for (const adv of adventures) {
    await RPGAdventure.upsert(adv);
    console.log(`Seeded adventure: ${adv.title}`);
  }

  process.exit();
}

seedAll();
