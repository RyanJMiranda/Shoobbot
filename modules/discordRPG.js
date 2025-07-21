// Main RPG module
const RPGUtils = require('./discordRPG/RPGUtils');
const RPGCharacterManager = require('./discordRPG/RPGCharacterManager');


// Aggregate all RPG slash commands
async function buildCommands() {
  // Await both, flatten, and return
  const cmds = [
    ...(await RPGCharacterManager.buildCommands()),

  ];
  return cmds;
}

// Aggregate all RPG initializers
function init(client) {
  if (typeof RPGCharacterManager.init === 'function') {
    console.log('init CharacterManager');
    RPGCharacterManager.init(client);
  }

}

module.exports = { buildCommands, init };
