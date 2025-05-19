const db = require('../../utils/db');
const now = new Date().toISOString();

const messages = [
  {
    server_id: '929384079193944135',
    channel_id: '1333192353002946643',
    message: 'When accessing the [Guild Bank], please ***DO NOT*** use any sorting feature from your addons.',
    message_title: 'Guild Bank Sorting Warning',
    message_type: 'message',
    color: '#2ecc71',
    footer_text: 'If you choose to ignore this Squatchin will find you',
    repeat_hours: 2,
  },
  {
    server_id: '929384079193944135',
    channel_id: '1333192353002946643',
    message: 'Raw materials should only be deposited in the ***FIRST TAB*** of the [Guild Bank]',
    message_title: 'Guild Bank Tab 1 Rules',
    message_type: 'message',
    color: '#e67e22',
    footer_text: 'Cmon man it\'s easy',
    repeat_hours: 2,
  },
];

messages.forEach((msg, i) => {
  db.run(`
    INSERT INTO messages (
      server_id,
      channel_id,
      message,
      message_title,
      message_type,
      color,
      footer_text,
      repeat_hours,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    msg.server_id,
    msg.channel_id,
    msg.message,
    msg.message_title,
    msg.message_type,
    msg.color,
    msg.footer_text,
    msg.repeat_hours,
    now,
    now
  ], (err) => {
    if (err) console.error(`Seeder failed for message ${i + 1}:`, err.message);
    else console.log(`Seeder: Inserted message ${i + 1}`);
  });
});
