
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

    const queries = [
        `CREATE TABLE IF NOT EXISTS rentacar_business (
            user_id INT PRIMARY KEY,
            safe_balance DECIMAL(15, 2) DEFAULT 0.00,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS rentacar_slots (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            slot_index INT NOT NULL,
            car_key VARCHAR(50) NOT NULL,
            health DECIMAL(5, 2) DEFAULT 100.00,
            start_time BIGINT NOT NULL,
            status ENUM('active', 'completed') DEFAULT 'active',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_slot (user_id, slot_index)
        )`
    ];

    let completed = 0;
    queries.forEach(q => {
        db.query(q, (err) => {
            if (err) console.error('Query failed:', err);
            else console.log('Table created/verified.');
            
            completed++;
            if (completed === queries.length) {
                console.log('All done.');
                db.end();
            }
        });
    });
});
