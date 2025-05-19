require('dotenv').config();
const { Client, Events, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Load all modules dynamically
const modulesPath = path.join(__dirname, 'modules');
fs.readdirSync(modulesPath).forEach(file => {
    const module = require(`./modules/${file}`);
    if (typeof module === 'function') {
        module(client); // Pass the client so modules can hook into it
        console.log(`Loaded module: ${file}`);
    }
});

client.once(Events.ClientReady, (client) => {
    console.log(`Logged in as ${client.user.tag} and ready to go`);
});

client.login(process.env.DISCORD_TOKEN);
