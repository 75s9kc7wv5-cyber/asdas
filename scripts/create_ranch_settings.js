
const mysql = require('mysql2');
const dbConfig = {
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
};

const db = mysql.createConnection(dbConfig);

const updates = [
    `CREATE TABLE IF NOT EXISTS ranch_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ranch_type VARCHAR(50) NOT NULL UNIQUE,
        production_time INT DEFAULT 60,
        daily_limit INT DEFAULT 100,
        energy_cost INT DEFAULT 10,
        salary INT DEFAULT 2500,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `INSERT IGNORE INTO ranch_settings (ranch_type, production_time, daily_limit, energy_cost, salary) VALUES 
    ('chicken', 60, 100, 10, 2500),
    ('sheep', 60, 100, 10, 2500),
    ('cow', 60, 100, 10, 2500),
    ('bee', 60, 100, 10, 2500)`
];

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');
    
    runUpdates(0);
});

function runUpdates(index) {
    if (index >= updates.length) {
        console.log('All updates completed.');
        db.end();
        process.exit(0);
    }

    const query = updates[index];
    console.log(`Running: ${query}`);
    
    db.query(query, (err, result) => {
        if (err) {
            console.error(`Error executing query: ${query}`, err);
        } else {
            console.log('Success.');
        }
        runUpdates(index + 1);
    });
}
