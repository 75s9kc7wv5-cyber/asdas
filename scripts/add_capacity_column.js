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
        // Check if column exists
        const columns = await runQuery("SHOW COLUMNS FROM player_farms");
        const hasCapacity = columns.some(c => c.Field === 'capacity');
        
        if (!hasCapacity) {
            console.log('Adding capacity column...');
            await runQuery(`
                ALTER TABLE player_farms 
                ADD COLUMN capacity INT DEFAULT 10000
            `);
            console.log('capacity column added.');
            
            // Update existing rows based on level
            console.log('Updating existing rows...');
            await runQuery(`
                UPDATE player_farms 
                SET capacity = IFNULL(level, 1) * 10000
            `);
            console.log('Existing rows updated.');
        } else {
            console.log('player_farms table already has capacity column.');
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
