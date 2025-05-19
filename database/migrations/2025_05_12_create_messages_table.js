const db = require('../../utils/db');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            message TEXT NOT NULL CHECK(length(message) <= 500),
            message_title TEXT NOT NULL CHECK(length(message) <= 255),
            message_type TEXT NOT NULL DEFAULT "message",
            color TEXT NULL,
            footer_text TEXT NULL,
            repeat_hours REAL NOT NULL,
            times_sent INTEGER NOT NULL DEFAULT 0,
            next_run_at TEXT NULL,
            message_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `, (err) => {
        if (err) console.error('Migration failed:', err.message);
        else console.log('Migration: messages table created.');
    });
});
