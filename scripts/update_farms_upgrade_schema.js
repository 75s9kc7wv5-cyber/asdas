const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database.');

    const sql = `
        ALTER TABLE farms 
        ADD COLUMN IF NOT EXISTS is_upgrading TINYINT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS upgrade_end_time BIGINT DEFAULT 0;
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error updating farms table:', err);
        } else {
            console.log('Farms table updated successfully.');
        }
        db.end();
    });
});
