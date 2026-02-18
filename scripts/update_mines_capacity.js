
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const alterTableQuery = `
        ALTER TABLE player_mines
        ADD COLUMN raw_capacity INT DEFAULT 1000,
        ADD COLUMN product_capacity INT DEFAULT 500;
    `;

    db.query(alterTableQuery, (err) => {
        if (err) {
            if (err.code !== 'ER_DUP_FIELDNAME') {
                console.error('Error altering player_mines:', err);
            } else {
                console.log('Columns already exist in player_mines.');
            }
        } else {
            console.log('Table player_mines updated with capacity columns.');
        }
        db.end();
    });
});
