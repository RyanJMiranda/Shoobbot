// Main RPG module
const RPGUtils = require('./discordRPG/RPGUtils');
const RPGCharacterManager = require('./discordRPG/RPGCharacterManager');

// Aggregate all RPG slash commands
const commands = [
  ...RPGCharacterManager.commands,
];

// Aggregate all RPG initializers
function init(client) {
  if (typeof RPGCharacterManager.init === 'function') {
    RPGCharacterManager.init(client);
  }
  // Add more submodules here as you grow
}

module.exports = { commands, init };
