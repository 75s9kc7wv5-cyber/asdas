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

    // Try adding columns directly. If they exist, it will fail, which is fine.
    const queries = [
        "ALTER TABLE users ADD COLUMN license_property_level INT DEFAULT 1",
        "ALTER TABLE player_properties ADD COLUMN last_tax_collected TIMESTAMP NULL"
    ];

    let completed = 0;
    queries.forEach((query, index) => {
        db.query(query, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Query ${index + 1} skipped (column exists).`);
                } else {
                    console.error(`Query ${index + 1} failed:`, err.message);
                }
            } else {
                console.log(`Query ${index + 1} success.`);
            }
            completed++;
            if (completed === queries.length) {
                console.log('All queries executed.');
                db.end();
            }
        });
    });
});
