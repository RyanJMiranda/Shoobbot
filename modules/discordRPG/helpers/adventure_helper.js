const { Op } = require('sequelize');
const RPGAdventureCooldown = require('../../../database/models/discordRPG/RPGAdventureCooldown');
const RPGAttribute = require('../../../database/models/discordRPG/RPGAttribute');
const RPGUtils = require('../RPGUtils'); 

// ---- Attribute Caching ----
let cachedAttributes = null;
async function getAllAttributes() {
  if (!cachedAttributes) {
    const attrs = await RPGAttribute.findAll();
    cachedAttributes = attrs.map(attr => ({
      key: attr.key,
      emoji: attr.emoji,
      label: attr.label,
      description: attr.description
    }));
  }
  return cachedAttributes;
}

async function isOnCooldown(userId) {
  const now = new Date();
  const cd = await RPGAdventureCooldown.findOne({
    where: {
      user_id: userId,
      expires_at: { [Op.gt]: now }
    }
  });
  if (cd) return { secondsLeft: Math.ceil((cd.expires_at - now) / 1000), adventure_id: cd.adventure_id };
  return false;
}

async function setCooldown(userId, seconds, adventure_id) {
  const expires = new Date(Date.now() + seconds * 1000);
  await RPGAdventureCooldown.upsert({
    user_id: userId,
    expires_at: expires,
    adventure_id: adventure_id
  });
}


// ---- Stat Requirement Check ----
async function characterMeetsRequirements(character, requirements, raceObj = null, items = {}) {
  // requirements: { strength: 12, wisdom: 10, ... }
  if (!requirements) return true;
  const statTotals = await RPGUtils.calculateStatTotals(character, raceObj, items);
  for (const [key, val] of Object.entries(requirements)) {
    if (!statTotals[key] || statTotals[key].total < val) return false;
  }
  return true;
}

// ---- Roll Checks for Adventures ----
function rollForSuccess(statTotal, difficulty) {
  const roll = RPGUtils.rollDice(20);
  const total = roll + statTotal;
  return {
    success: total >= difficulty,
    roll,
    total,
    dc: difficulty
  };
}

// Get all adventures character qualifies for
async function getQualifyingAdventures(character) {
  // You need to implement this to actually filter from RPGAdventure
  // For now: return all adventures (replace with logic)
  const RPGAdventure = require('../../../database/models/discordRPG/RPGAdventure');
  const allAdventures = await RPGAdventure.findAll();
  return allAdventures.filter(a => {

    return true;
  });
}

function skillCheck(character, adventure) {
    return {success: true, checks: {}};
  const requirements = adventure.required_stats || {};
  const results = [];
  let allPassed = true;

  for (const [stat, requiredValue] of Object.entries(requirements)) {
    const statTotal = typeof character[stat] === 'number' ? character[stat] : 0;
    const result = rollForSuccess(statTotal, requiredValue);
    results.push({ stat, ...result });
    if (!result.success) allPassed = false;
  }

  // If no requirements, treat as auto-success
  if (Object.keys(requirements).length === 0) {
    return { success: true, checks: [] };
  }

  return { success: allPassed, checks: results };
}


// ---- Exported API ----
module.exports = {
  getAllAttributes,
  isOnCooldown,
  setCooldown,
  characterMeetsRequirements,
  rollForSuccess,
  getQualifyingAdventures,
  skillCheck
  // ...RPGUtils
};
