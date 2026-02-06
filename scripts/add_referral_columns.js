const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld',
    multipleStatements: true
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL');

    const sql = `
        ALTER TABLE users 
        ADD COLUMN referral_count INT DEFAULT 0,
        ADD COLUMN referral_tier INT DEFAULT 0,
        ADD COLUMN referrer_id INT DEFAULT NULL;
    `;

    db.query(sql, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Columns already exist.');
            } else {
                console.error('Error adding columns:', err);
            }
        } else {
            console.log('Referral columns added successfully.');
        }
        db.end();
    });
});
