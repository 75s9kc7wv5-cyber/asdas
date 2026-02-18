
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

        // 3. Add missing columns to player_farms (Without IF NOT EXISTS for compatibility)
        `ALTER TABLE player_farms ADD COLUMN salary INT DEFAULT 0`,
        `ALTER TABLE player_farms ADD COLUMN reserve INT DEFAULT 0`,
        `ALTER TABLE player_farms ADD COLUMN stock INT DEFAULT 0`,
        `ALTER TABLE player_farms ADD COLUMN vault INT DEFAULT 0`,
        `ALTER TABLE player_farms ADD COLUMN capacity INT DEFAULT 1000`,
        `ALTER TABLE player_farms ADD COLUMN max_workers INT DEFAULT 5`,
        `ALTER TABLE player_farms ADD COLUMN efficiency INT DEFAULT 100`
    ];

    processQueries(queries);
});

function processQueries(queries) {
    if (queries.length === 0) {
        console.log('All queries executed.');
        db.end();
        return;
    }

    const query = queries.shift();
    console.log('Executing:', query);

    db.query(query, (err, result) => {
        if (err) {
            // 1060: Duplicate column name
            if (err.errno === 1060) {
                console.log('Column already exists, skipping.');
            } else {
                console.error('Query Error (' + err.errno + '):', err.sqlMessage || err.message);
            }
        } else {
            console.log('Success.');
        }
        processQueries(queries);
    });
}
