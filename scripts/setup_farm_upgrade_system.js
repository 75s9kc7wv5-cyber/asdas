const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(async (err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    try {
        // 1. Create farm_levels table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS farm_levels (
                level INT PRIMARY KEY,
                cost_money BIGINT DEFAULT 0,
                cost_gold INT DEFAULT 0,
                cost_diamond INT DEFAULT 0,
                cost_wood INT DEFAULT 0,
                cost_brick INT DEFAULT 0,
                cost_cement INT DEFAULT 0,
                cost_glass INT DEFAULT 0,
                cost_steel INT DEFAULT 0,
                duration_seconds INT DEFAULT 60,
                capacity_worker_increase INT DEFAULT 5,
                capacity_storage_increase INT DEFAULT 500
            )
        `);
        console.log('farm_levels table created/checked.');

        // 2. Populate farm_levels (Levels 2-10)
        // Formula: Base * Level multiplier roughly
        const levels = [];
        for (let i = 2; i <= 10; i++) {
            levels.push([
                i, 
                i * 1000000, // Money: 2M, 3M...
                i * 50,      // Gold
                i * 10,      // Diamond
                i * 100,     // Wood
                i * 100,     // Brick
                i * 50,      // Cement
                i * 50,      // Glass
                i * 25,      // Steel
                i * 60 * 5,  // Duration: 10 min, 15 min... (i * 5 mins)
                5,           // Worker +5
                500          // Storage +500
            ]);
        }

        for (const lvl of levels) {
            await runQuery(`
                INSERT INTO farm_levels 
                (level, cost_money, cost_gold, cost_diamond, cost_wood, cost_brick, cost_cement, cost_glass, cost_steel, duration_seconds, capacity_worker_increase, capacity_storage_increase)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                cost_money=VALUES(cost_money), cost_gold=VALUES(cost_gold), duration_seconds=VALUES(duration_seconds)
            `, lvl);
        }
        console.log('farm_levels populated.');

        // 3. Alter player_farms table
        // Check if columns exist first to avoid errors
        const columns = await runQuery("SHOW COLUMNS FROM player_farms");
        const hasUpgradeEnd = columns.some(c => c.Field === 'upgrade_end_time');
        
        if (!hasUpgradeEnd) {
            await runQuery(`
                ALTER TABLE player_farms 
                ADD COLUMN upgrade_end_time DATETIME NULL,
                ADD COLUMN is_upgrading BOOLEAN DEFAULT FALSE
            `);
            console.log('player_farms table altered.');
        } else {
            console.log('player_farms table already has upgrade columns.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        db.end();
        process.exit(0);
    }
});

function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.query(query, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}
