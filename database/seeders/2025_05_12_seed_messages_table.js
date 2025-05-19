const db = require('../../utils/db');

const now = new Date().toISOString();

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
    '1136394256769097798',
    '1324185705961750700',
    'Please allow me to repeat this message for testing',
    'A Test Message',
    'message',              // message_type
    '#2ecc71',              // color (hex string)
    'This is a custom footer text.',
    0.01,                   // repeat_hours
    now,
    now
], (err) => {
    if (err) console.error('Seeder failed:', err.message);
    else console.log('Seeder: test message inserted.');
});
