const RPGAttribute = require('../../database/models/discordRPG/RPGAttribute');

let cachedAttributes = null;
async function getAllAttributes() {
  if (!cachedAttributes) {
    const attrs = await RPGAttribute.findAll();
    // Store as array of { key, emoji, label, description }
    cachedAttributes = attrs.map(attr => ({
      key: attr.key,
      emoji: attr.emoji,
      label: attr.label,
      description: attr.description
    }));
  }
  return cachedAttributes;
}

function rollDice(sides = 6) {
  return Math.floor(Math.random() * sides) + 1;
}

function rollStat4d6DropLowest() {
  const rolls = [rollDice(), rollDice(), rollDice(), rollDice()];
  rolls.sort((a, b) => a - b);
  // Drop the lowest
  return rolls[1] + rolls[2] + rolls[3];
}

function getStatWithRaceBonus(stat, character, raceObj) {
  let val = character[stat];
  if (!raceObj) return val;
  if (stat === raceObj.bonus_attribute) val += 1;
  if (stat === raceObj.malus_attribute) val -= 1;
  return val;
}

async function calculateStatTotals(character, raceObj, items = {}) {
  const attributes = await getAllAttributes();
  function getItemBonus(stat) {
    let bonus = 0;
    for (const slot of ['weapon', 'armour', 'accessory1', 'accessory2']) {
      if (items[slot] && typeof items[slot][stat] === 'number') {
        bonus += items[slot][stat];
      }
    }
    return bonus;
  }

  const totals = {};
  for (const attr of attributes) {
    const stat = attr.key;
    let base = typeof character[stat] === "number" ? character[stat] : 0;
    let raceBonus = 0;
    if (raceObj) {
      if (stat === raceObj.bonus_attribute) raceBonus += 1;
      if (stat === raceObj.malus_attribute) raceBonus -= 1;
    }
    let itemBonus = getItemBonus(stat);
    totals[stat] = {
      key: stat,
      emoji: attr.emoji,
      label: attr.label,
      base,
      raceBonus,
      itemBonus,
      total: base + raceBonus + itemBonus
    };
  }
  return totals;
}

function getRarityInfo(rarityValue) {
  if (rarityValue < 1.5) {
    return { name: "Common", emoji: "⚪", color: "#b0b0b0" };
  } else if (rarityValue < 2.5) {
    return { name: "Uncommon", emoji: "🟢", color: "#2ecc40" };
  } else if (rarityValue < 3.5) {
    return { name: "Rare", emoji: "🔵", color: "#3498db" };
  } else if (rarityValue < 4.5) {
    return { name: "Epic", emoji: "🟣", color: "#9b59b6" };
  } else {
    return { name: "Legendary", emoji: "🟠", color: "#e67e22" };
  }
}

function formatItem(item) {
  if (!item) return "None";
  const rarity = item.rarity ? getRarityInfo(item.rarity) : null;
  return `**${item.name}**${rarity ? ` ${rarity.emoji} ${rarity.name}` : ""}`;
}


module.exports = {
  rollDice,
  rollStat4d6DropLowest,
  getStatWithRaceBonus,
  calculateStatTotals,
  getRarityInfo,
  formatItem
};
