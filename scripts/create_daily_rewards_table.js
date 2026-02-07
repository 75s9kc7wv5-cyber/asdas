const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('DB Connection Error:', err);
        process.exit(1);
    }
    console.log('Connected to DB');

    const sql = `
        CREATE TABLE IF NOT EXISTS user_daily_rewards (
            user_id INT NOT NULL,
            last_claim_date DATETIME DEFAULT NULL,
            current_streak INT DEFAULT 0,
            PRIMARY KEY (user_id)
        )
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Table user_daily_rewards created or already exists.');
        }
        db.end();
    });
});
