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
                    // Ignore duplicate column error (1060)
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
        console.log('Adding is_upgrading column...');
        await runQuery("ALTER TABLE farms ADD COLUMN is_upgrading TINYINT DEFAULT 0");
        
        console.log('Adding upgrade_end_time column...');
        await runQuery("ALTER TABLE farms ADD COLUMN upgrade_end_time BIGINT DEFAULT 0");
        
        console.log('Farms table updated successfully.');
    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        db.end();
    }
});
