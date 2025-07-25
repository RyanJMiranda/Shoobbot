const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/database.db', (err) => {
    if (err) return console.error(err.message);
    console.log('DB connected.');
});

module.exports = db;
