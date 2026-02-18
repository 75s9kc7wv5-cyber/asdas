
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
        // 1. Create farm_levels table
        `CREATE TABLE IF NOT EXISTS farm_levels (
            level INT PRIMARY KEY,
            duration_seconds INT DEFAULT 60,
            cost_money INT DEFAULT 0,
            cost_gold INT DEFAULT 0,
            cost_diamond INT DEFAULT 0,
            cost_wood INT DEFAULT 0,
            cost_brick INT DEFAULT 0,
            cost_cement INT DEFAULT 0,
            cost_glass INT DEFAULT 0,
            cost_steel INT DEFAULT 0,
            capacity_worker_increase INT DEFAULT 1,
            capacity_storage_increase INT DEFAULT 1000
        )`,

        // 2. Add farm_levels data (Levels 2-10)
        `INSERT IGNORE INTO farm_levels (level, duration_seconds, cost_money, cost_gold, cost_diamond, cost_wood, cost_brick, cost_cement, cost_glass, cost_steel, capacity_worker_increase, capacity_storage_increase) VALUES 
        (2, 3600, 10000, 10, 1, 50, 50, 10, 0, 0, 2, 2000),
        (3, 7200, 25000, 25, 2, 100, 100, 25, 10, 5, 3, 3000),
        (4, 14400, 50000, 50, 5, 200, 200, 50, 25, 10, 4, 4000),
        (5, 28800, 100000, 100, 10, 400, 400, 100, 50, 20, 5, 5000),
        (6, 57600, 200000, 200, 20, 800, 800, 200, 100, 40, 6, 6000),
        (7, 86400, 400000, 400, 40, 1600, 1600, 400, 200, 80, 7, 7000),
        (8, 172800, 800000, 800, 80, 3200, 3200, 800, 400, 160, 8, 8000),
        (9, 259200, 1600000, 1600, 160, 6400, 6400, 1600, 800, 320, 9, 9000),
        (10, 518400, 3200000, 3200, 320, 12800, 12800, 3200, 1600, 640, 10, 10000)`,

        // 3. Add 'name' column to player_farms
        `ALTER TABLE player_farms ADD COLUMN name VARCHAR(100) DEFAULT NULL`
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
