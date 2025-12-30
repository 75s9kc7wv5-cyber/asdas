const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(async (err) => {
    if (err) throw err;
    console.log('Connected to database.');

    const runQuery = (sql) => {
        return new Promise((resolve, reject) => {
            db.query(sql, (err, result) => {
                if (err) {
                    if (err.errno === 1060) {
                        console.log('Column already exists, skipping.');
                        resolve();
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(result);
                }
            });
        });
    };

    try {
        console.log('Adding is_upgrading column to player_farms...');
        await runQuery("ALTER TABLE player_farms ADD COLUMN is_upgrading TINYINT DEFAULT 0");
        
        // upgrade_end_time already exists as DATETIME, so we don't need to add it.
        // But let's check if we need to modify it or if it's fine.
        // The prompt implies a timestamp or duration. DATETIME is fine.
        
        console.log('player_farms table updated successfully.');
    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        db.end();
    }
});
