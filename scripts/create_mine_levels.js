
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

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS mine_levels (
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
            capacity_worker_increase INT DEFAULT 5,
            capacity_storage_increase INT DEFAULT 500
        );
    `;

    db.query(createTableQuery, (err) => {
        if (err) {
            console.error('Error creating table:', err);
            db.end();
            return;
        }
        console.log('Table mine_levels created.');

        // Insert default levels (1 to 20)
        const levels = [];
        for (let i = 2; i <= 20; i++) {
            levels.push([
                i, 
                i * 60, // duration (minutes = level)
                (i-1) * 1000000, // money
                (i-1) * 50, // gold
                (i-1) * 5, // diamond
                (i-1) * 1000, // wood
                (i-1) * 1000, // brick
                (i-1) * 500, // cement
                (i-1) * 500, // glass
                (i-1) * 200, // steel
                5, // worker inc
                1000 // storage inc
            ]);
        }

        const insertQuery = `INSERT IGNORE INTO mine_levels (level, duration_seconds, cost_money, cost_gold, cost_diamond, cost_wood, cost_brick, cost_cement, cost_glass, cost_steel, capacity_worker_increase, capacity_storage_increase) VALUES ?`;

        db.query(insertQuery, [levels], (err) => {
            if (err) console.error('Error inserting data:', err);
            else console.log('Default levels inserted.');
            db.end();
        });
    });
});
