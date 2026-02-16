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
    console.log('Connected.');

    const queries = [
        "ALTER TABLE users ADD COLUMN license_property_level INT DEFAULT 1",
        "ALTER TABLE player_properties ADD COLUMN last_tax_collected TIMESTAMP NULL"
    ];

    let completed = 0;
    queries.forEach(q => {
        db.query(q, (err) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column already exists (OK).');
                } else {
                    console.error('Error:', err.message);
                }
            } else {
                console.log('Column added.');
            }
            completed++;
            if (completed === queries.length) db.end();
        });
    });
});
