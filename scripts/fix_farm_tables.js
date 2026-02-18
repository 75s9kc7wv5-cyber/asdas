
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to database.');

    const queries = [
        // 1. Create farm_active_workers table
        `CREATE TABLE IF NOT EXISTS farm_active_workers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            farm_id INT NOT NULL,
            user_id INT NOT NULL,
            end_time DATETIME,
            amount INT DEFAULT 0,
            seed_cost INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // 2. Create farm_logs table
        `CREATE TABLE IF NOT EXISTS farm_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            farm_id INT NOT NULL,
            user_id INT NOT NULL,
            message TEXT,
            amount INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // 3. Add missing columns to player_farms
        `ALTER TABLE player_farms ADD COLUMN IF NOT EXISTS salary INT DEFAULT 0`,
        `ALTER TABLE player_farms ADD COLUMN IF NOT EXISTS reserve INT DEFAULT 0`,
        `ALTER TABLE player_farms ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0`,
        `ALTER TABLE player_farms ADD COLUMN IF NOT EXISTS vault INT DEFAULT 0`,
        `ALTER TABLE player_farms ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 1000`,
        `ALTER TABLE player_farms ADD COLUMN IF NOT EXISTS max_workers INT DEFAULT 5`,
        `ALTER TABLE player_farms ADD COLUMN IF NOT EXISTS efficiency INT DEFAULT 100`
    ];

    runQueries(queries);
});

function runQueries(queries) {
    if (queries.length === 0) {
        console.log('All queries executed.');
        db.end();
        return;
    }

    const query = queries.shift();
    console.log('Executing:', query);

    db.query(query, (err, result) => {
        if (err) {
            // Ignore "Duplicate column name" error (Code 1060)
            if (err.errno === 1060) {
                console.log('Column already exists, skipping.');
            } else {
                console.error('Query Error:', err);
            }
        } else {
            console.log('Success.');
        }
        runQueries(queries);
    });
}
