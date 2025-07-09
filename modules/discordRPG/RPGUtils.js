// Dice rolling and utility functions

function rollDice(num, sides) {
  // Rolls 'num' dice, each with 'sides' sides, returns array
  return Array.from({ length: num }, () => Math.ceil(Math.random() * sides));
}

function rollStat4d6DropLowest() {
  const rolls = rollDice(4, 6);
  rolls.sort((a, b) => a - b);
  // Drop lowest, sum highest 3
  return rolls.slice(1).reduce((a, b) => a + b, 0);
}

module.exports = { rollDice, rollStat4d6DropLowest };
