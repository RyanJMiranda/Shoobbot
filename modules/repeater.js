const {
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    SlashCommandBuilder,
    ButtonBuilder,
    ButtonStyle,
    REST,
    Routes
} = require('discord.js');

const db = require('../utils/db');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder()
        .setName('getmessages')
        .setDescription('List all scheduled messages for this server')
        .toJSON(),
    new SlashCommandBuilder()
        .setName('newmessage')
        .setDescription('Create a new repeating message')
        .addChannelOption(option => 
            option.setName('channel_id')
                .setDescription('Provide a Channel To Repeat Into')
                .setRequired(true),
        )
        .addStringOption(option => 
            option.setName('message_title')
                .setDescription('Title this message (shown on Embeds)')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The message to repeat! Keep it short and sweet!')
                .setRequired(true)
        )
        .addNumberOption(option =>
            option.setName('repeat_hours')
              .setDescription('How often should this repeat (in hours)?')
              .setMinValue(0.1)
              .setRequired(true)
          )
          .addStringOption(option =>
            option.setName('footer_text')
              .setDescription('Small footer text to show at the bottom of the message')
              .setRequired(false)
          )          
        .toJSON()
];

module.exports = (client) => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const clientId = process.env.DISCORD_CLIENT_ID;
    const registeredGuilds = new Set();

    rest.put(Routes.applicationCommands(clientId), { body: [] })
        .then(() => console.log('[Repeater] Cleared global commands'))
        .catch(console.error);
  
    // Register commands dynamically per guild on startup
    db.all(`SELECT DISTINCT server_id FROM messages WHERE message_active = 1`, async (err, rows) => {
        if (err) return console.error('[Repeater] Failed to fetch server_ids:', err.message);
  
        for (const { server_id } of rows) {
            if (registeredGuilds.has(server_id)) continue;
            try {
                await rest.put(
                    Routes.applicationGuildCommands(clientId, server_id), { body: [] }
                )
                .then(() => console.log(`[Repeater] Cleared guild-specific commands for ${server_id}`))
                .catch(console.error);

                await rest.put(
                    Routes.applicationGuildCommands(clientId, server_id),
                    { body: commands }
                )
                .then(() => console.log(`[Repeater] Registered commands for guild ${server_id}`))
                .catch(console.error);

                registeredGuilds.add(server_id);
            } catch (err) {
                console.error(`[Repeater] Failed to register commands for guild ${server_id}:`, err.message);
            }
        }
    });

    setInterval(() => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const timestamp = `[${hours}:${minutes}:${seconds}]`;
        const nowISO = now.toISOString();
        db.all(`SELECT * FROM messages WHERE message_active = 1 AND next_run_at IS NOT NULL AND next_run_at <= ?`, [nowISO], (err, rows) => {
            if (err) return console.error('[Repeater] Failed to query messages:', err.message);

            rows.forEach((row) => {
                const { channel_id, repeat_hours } = row;
                const nextRun = new Date(row.next_run_at);
                const channel = client.channels.cache.get(channel_id);
                const channelDisplay = channel ? `#${channel.name}` : `<#${row.channel_id}>`;

                if (!channel) {
                    console.warn(`[Repeater]${timestamp} Channel ${channel_id} not found for server ${row.server_id}`);
                    return;
                }

                const isTooLate = now - nextRun > repeat_hours * 3600 * 1000;

                const sendAndReschedule = (skipSend = false) => {
                    const nextRunTime = new Date(Date.now() + repeat_hours * 3600 * 1000).toISOString();
                    db.run(
                        `UPDATE messages SET times_sent = times_sent + ?, updated_at = ?, next_run_at = ? WHERE id = ?`,
                        [skipSend ? 0 : 1, new Date().toISOString(), nextRunTime, row.id]
                    );
                };

                // If we missed the schedule by more than 1 repeat cycle, reschedule but don't send
                if (isTooLate) {
                    console.log(`[Repeater]${timestamp} Skipping send for ${row.id} — too late to post, rescheduling.`);
                    return sendAndReschedule(true);
                }

                sendAndReschedule();

                if (row.message_type === 'embed') {
                    const embed = new EmbedBuilder()
                        .setTitle(row.message_title || '📣 Scheduled Message')
                        .setDescription(row.message)
                        .setColor(row.color || '#2ecc71')
                        .setFooter({
                            text: row.footer_text || `Message ID: ${row.id} • Repeats every ${repeat_hours}h`
                        })
                        .setTimestamp();

                    
                    channel.send({ embeds: [embed] })
                        .then(() => {
                            console.log(`[Repeater]${timestamp} Embed sent to ${channelDisplay} titled ${row.message_title}`);

                        })
                        .catch(err => {
                            console.error(`[Repeater]${timestamp} Failed to send embed to ${channelDisplay}:`, err.message);
                        });

                } else {
                    channel.send(row.message)
                    .then(() => {
                        console.log(`[Repeater]${timestamp} Message sent to ${channelDisplay} titled ${row.message_title}`);
                        
                    })
                    .catch(err => {
                        console.error(`[Repeater]${timestamp} Failed to send message to ${channelDisplay}:`, err.message);
                    });
                }
            });
        });
    }, 1000); // every minute

    client.on('interactionCreate', async (interaction) => {
        const serverId = interaction.guildId;
        // this branch handles button presses
        if (interaction.isButton()){
            const match = interaction.customId.match(/^toggle_active_(\d+)$/);
            if (match) {
                const messageId = parseInt(match[1], 10);

                db.get(`SELECT message_active FROM messages WHERE id = ?`, [messageId], (err, row) => {
                    if (err || !row) {
                    return interaction.reply({ content: 'Message not found.', flags: 1 << 6 });
                    }

                    const newStatus = row.message_active ? 0 : 1;

                    db.run(`UPDATE messages SET message_active = ?, updated_at = ? WHERE id = ?`, [
                    newStatus,
                    new Date().toISOString(),
                    messageId
                    ], (err) => {
                    if (err) {
                        return interaction.reply({ content: 'Failed to update message status.', flags: 1 << 6});
                    }

                    return interaction.reply({
                        content: `Message has been ${newStatus ? 're-activated' : 'deactivated'}.`,
                        flags: 1 << 6
                    });
                    });
                });
                }

                // Update message button
                const updateMatch = interaction.customId.match(/^update_message_(\d+)$/);
                if (updateMatch) {
                const messageId = parseInt(updateMatch[1], 10);

                // Get current message value to pre-fill modal
                db.get(`SELECT message FROM messages WHERE id = ?`, [messageId], async (err, row) => {
                    if (err || !row) {
                    return interaction.reply({ content: 'Message not found.', flags: 1 << 6 });
                    }

                    const modal = new ModalBuilder()
                    .setCustomId(`submit_updated_message_${messageId}`)
                    .setTitle('Update Scheduled Message');

                    const messageInput = new TextInputBuilder()
                    .setCustomId('updated_message')
                    .setLabel('Enter new message content')
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(row.message)
                    .setMaxLength(500)
                    .setRequired(true);

                    const actionRow = new ActionRowBuilder().addComponents(messageInput);
                    modal.addComponents(actionRow);

                    await interaction.showModal(modal);
                });
                return;
            }

            const repeatMatch = interaction.customId.match(/^update_repeat_(\d+)$/);
            if(repeatMatch){
                const messageId = parseInt(repeatMatch[1], 10);
        
                // Get current message value to pre-fill modal
                db.get(`SELECT repeat_hours FROM messages WHERE id = ?`, [messageId], async (err, row) => {
                if (err || !row) {
                    return interaction.reply({ content: 'Message not found.', flags: 1 << 6 });
                }
        
                const modal = new ModalBuilder()
                    .setCustomId(`submit_updated_repeat_${messageId}`)
                    .setTitle('Update Repeat Interval');
        
                const messageInput = new TextInputBuilder()
                    .setCustomId('updated_interval')
                    .setLabel('Repeat Interval Hours')
                    .setStyle(TextInputStyle.Short)
                    .setValue(String(row.repeat_hours))
                    .setMaxLength(500)
                    .setRequired(true);
        
                const actionRow = new ActionRowBuilder().addComponents(messageInput);
                modal.addComponents(actionRow);
        
                await interaction.showModal(modal);
                });
                return;
            }
        }
        // this branch handles any modal submits needed by repeater
        if (interaction.isModalSubmit()) {
            const match = interaction.customId.match(/^submit_updated_message_(\d+)$/);
            if (match) {
                const messageId = parseInt(match[1], 10);
                const newContent = interaction.fields.getTextInputValue('updated_message');
                db.run(
                    `UPDATE messages SET message = ?, updated_at = ? WHERE id = ?`,
                    [newContent, new Date().toISOString(), messageId],
                    (err) => {
                    if (err) {
                        return interaction.reply({ content: 'Failed to update message.', flags: 1 << 6 });
                    }

                    return interaction.reply({
                        content: 'Message content updated successfully!',
                        flags: 1 << 6
                    });
                    }
                );
            }
            const updateRepeatHoursMatch = interaction.customId.match(/^submit_updated_repeat_(\d+)$/);
            if (updateRepeatHoursMatch) {
                const messageId = parseInt(updateRepeatHoursMatch[1], 10);
                const newContent = interaction.fields.getTextInputValue('updated_interval');
                
                const newRepeatHours = parseFloat(newContent);
                
                if (isNaN(newRepeatHours) || newRepeatHours <= 0) {
                    return interaction.reply({
                    content: '❌ Invalid repeat interval. Please enter a number greater than 0.',
                    flags: 1 << 6
                    });
                }
                
                const now = new Date();
                const nextRunAt = new Date(now.getTime() + newRepeatHours * 3600 * 1000).toISOString();
                
                db.run(
                    `UPDATE messages SET repeat_hours = ?, next_run_at = ?, updated_at = ? WHERE id = ?`,
                    [newRepeatHours, nextRunAt, now.toISOString(), messageId],
                    (err) => {
                    if (err) {
                        return interaction.reply({
                        content: '❌ Failed to update repeat interval.',
                        flags: 1 << 6
                        });
                    }
                
                    return interaction.reply({
                        content: `✅ Repeat interval updated to ${newRepeatHours} hour(s). Next run scheduled for <t:${Math.floor(new Date(nextRunAt).getTime() / 1000)}:R>`,
                        flags: 1 << 6
                    });
                    }
                );
            }      
        }
        // This branch handles slash commands from chat
        if (interaction.isChatInputCommand()){
            if (interaction.commandName === 'getmessages') {
                db.all(`SELECT * FROM messages WHERE server_id = ?`, [serverId], async (err, rows) => {
                    if (err) return interaction.reply({ content: 'Failed to fetch messages.', flags: 1 << 6 });
                    if (!rows.length) return interaction.reply({ content: 'No scheduled messages found.', flags: 1 << 6 });
            
                    for (const row of rows) {
                        const nextRun = row.next_run_at ? new Date(row.next_run_at) : null;
                        const now = new Date();
                        let durationStr = 'Not Scheduled';
                        let relativeTime = '';
                        const channel = client.channels.cache.get(row.channel_id);
                        const channelDisplay = channel ? `#${channel.name}` : `<#${row.channel_id}>`;

            
                        if (nextRun) {
                            const diffMs = nextRun - now;
                            const diffMins = Math.max(0, Math.floor(diffMs / 60000));
                            const hours = Math.floor(diffMins / 60);
                            const minutes = diffMins % 60;
                            durationStr = `${hours} hour(s) & ${minutes} minute(s)`;
                            const nextEpoch = Math.floor(nextRun.getTime() / 1000);
                            relativeTime = `<t:${nextEpoch}:R>`;
                        }
            
                        const embed = new EmbedBuilder()
                            .setTitle(row.message_title)
                            .setDescription(`
                                ${row.message}
                                🔁 **Repeats Every:** ${row.repeat_hours} hour(s)
                                📢 **In Channel:** ${channelDisplay}
                                📝 **Message Type:** ${row.message_type}
                                ⏰ **Next Run:** ${durationStr}${relativeTime ? ` (${relativeTime})` : ''}`)
                            .setColor(row.color || '#2ecc71')
                            .setFooter({ text: `ID: ${row.id} • Times Sent: ${row.times_sent ?? 0}` });
            
                        const actionRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`update_message_${row.id}`)
                            .setLabel('📝 Update Message')
                            .setStyle(ButtonStyle.Primary),
                        
                        new ButtonBuilder()
                            .setCustomId(`update_repeat_${row.id}`)
                            .setLabel('🔁 Update Schedule')
                            .setStyle(ButtonStyle.Primary),
            
                        new ButtonBuilder()
                            .setCustomId(`toggle_active_${row.id}`)
                            .setLabel(row.message_active ? 'Deactivate' : 'Reactivate')
                            .setStyle(row.message_active ? ButtonStyle.Danger : ButtonStyle.Success)
                        );
            
                        await interaction.channel.send({ embeds: [embed], components: [actionRow] });
                    }
            
                    await interaction.reply({ content: `Found ${rows.length} scheduled messages.`, flags: 1 << 6 });
                });
            } else if (interaction.commandName === 'newmessage') {
                const channel = interaction.options.getChannel('channel_id');
                const title = interaction.options.getString('message_title');
                const message = interaction.options.getString('message');
                const repeatHours = interaction.options.getNumber('repeat_hours');
              
                const now = new Date();
                const nextRunAt = new Date(now.getTime() + repeatHours * 3600 * 1000).toISOString();
              
                db.run(
                  `INSERT INTO messages (server_id, channel_id, message, message_title, message_type, color, footer_text, repeat_hours, times_sent, created_at, updated_at, next_run_at, message_active)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    interaction.guildId,
                    channel.id,
                    message,
                    title,
                    'message',
                    '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
                    interaction.options.getString('footer_text') || null,
                    repeatHours,
                    0,
                    now.toISOString(),
                    now.toISOString(),
                    nextRunAt,
                    1
                  ],
                  (err) => {
                    if (err) {
                      console.error('[Repeater][NewMessage][Error] DB insert error:', err.message);
                      return interaction.reply({ content: '❌ Failed to create message.', flags: 1 << 6 });
                    }
              
                    interaction.reply({
                      content: `✅ Message created! Will repeat every ${repeatHours} hour(s) in <#${channel.id}>.`,
                      flags: 1 << 6
                    });
                  }
                );
              }              
        }
    });
};
