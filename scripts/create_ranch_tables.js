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
    console.log('Connected!');

    const queries = [
        `CREATE TABLE IF NOT EXISTS ranch_active_workers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ranch_id INT NOT NULL,
            user_id INT NOT NULL,
            start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            end_time TIMESTAMP NULL,
            amount INT DEFAULT 0,
            FOREIGN KEY (ranch_id) REFERENCES player_ranches(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS ranch_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ranch_id INT NOT NULL,
            user_id INT NOT NULL,
            message VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    let completed = 0;
    queries.forEach(query => {
        db.query(query, (err) => {
            if (err) console.error('Query failed:', err.message);
            else console.log('Query success');
            
            completed++;
            if (completed === queries.length) {
                console.log('All done');
                db.end();
            }
        });
    });
});
