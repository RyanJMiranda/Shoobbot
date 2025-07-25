require('dotenv').config();
const { Client, Events, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  });

async function safeRestPut(rest, route, body, maxRetries = 3) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await rest.put(route, body);
        } catch (error) {
            if (error.code === 'UND_ERR_CONNECT_TIMEOUT') {
                attempt++;
                if (attempt < maxRetries) {
                    console.warn(`Timeout, retrying (${attempt}/${maxRetries})...`);
                    await new Promise(r => setTimeout(r, 3000)); // Wait 3 seconds
                } else {
                    throw error;
                }
            } else {
                throw error;
            }
        }
    }
}

async function getCommandsFromModule(mod) {
  if (typeof mod.buildCommands === 'function') {
    const cmds = await mod.buildCommands();
    return Array.isArray(cmds) ? cmds : [];
  }
  if (Array.isArray(mod.commands)) {
    return mod.commands;
  }
  return [];
}

client.once(Events.ClientReady, async (client) => {
    console.log(`Logged in as ${client.user.tag} and ready to go`);

    // --- STEP 1: Gather all modules and their commands ---
    const modulesPath = path.join(__dirname, 'modules');
    const modules = [];
    let allCommands = [];

    const files = fs.readdirSync(modulesPath).filter(file => {
        const filePath = path.join(modulesPath, file);
        return fs.statSync(filePath).isFile() && file.endsWith('.js');
    });

    // Load all modules first
    for (const file of files) {
        const filePath = path.join(modulesPath, file);
        const mod = require(filePath);
        modules.push({ mod, file });
    }

    // Now, get all commands (supports async)
    for (const { mod } of modules) {
        const cmds = await getCommandsFromModule(mod);
        allCommands = allCommands.concat(cmds);
    }

    // --- STEP 2: Remove all guild commands and register new ones ---
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    for (const [guildId] of client.guilds.cache) {
        // Remove old commands
        try {
            console.log(`Preparing to clear old commands for guild ${guildId}`)
            await safeRestPut(
                rest,
                Routes.applicationGuildCommands(client.user.id, guildId),
                { body: [] }
            );
            console.log(`✅ Removed all commands for guild ${guildId}`);
            // etc...
        } catch (error) {
            console.error(`❌ Failed to remove commands for guild ${guildId}:`, error);
        }
        // Time registration
        const start = Date.now();
        try {
            console.log(`Preparing to instantiate new commands for guild ${guildId}`)
            await safeRestPut(
                rest, Routes.applicationGuildCommands(client.user.id, guildId),
                { body: allCommands }
            );
            const ms = Date.now() - start;
            console.log(`✅ Registered ${allCommands.length} commands for guild ${guildId} in ${ms}ms`);
        } catch (error) {
            const ms = Date.now() - start;
            console.error(`❌ Failed to register commands for guild ${guildId} after ${ms}ms:`, error);
        }
    }

    // --- STEP 3: Initialize all modules ---
    modules.forEach(({ mod, file }) => {
        if (typeof mod.init === 'function') {
            mod.init(client);
            console.log(`Initialized module: ${file || 'anonymous'}`);
        }
    });

    // (Optional) Other startup logic here
});

client.login(process.env.DISCORD_TOKEN);
