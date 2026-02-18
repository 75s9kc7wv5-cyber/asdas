const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

const TARGET_USER_ID = 1; // Change if needed

db.connect(async (err) => {
    if (err) throw err;
    console.log('DB Connected');

    try {
        // 1. Clear Tables (Optional, but safe)
        await query('TRUNCATE TABLE market_trades');
        await query('TRUNCATE TABLE market_history');

        // 2. Generate Random History Data (Last 2 hours)
        console.log('Generating Market History...');
        let price = 1000;
        const now = Date.now();
        
        // Insert 20 points
        for(let i=20; i>=0; i--) {
            // Random walk
            const change = (Math.random() - 0.5) * 50; 
            price += change;
            if(price < 100) price = 100;
            
            const time = new Date(now - (i * 5 * 60000)); // Every 5 mins
            
            await query('INSERT INTO market_history (price, volume, created_at) VALUES (?, ?, ?)', 
                [price, Math.random() * 2, time]);
        }
        console.log(`Current Price set to: $${price.toFixed(2)}`);

        // 3. Reset User Balance
        console.log(`Resetting User ${TARGET_USER_ID} balance...`);
        await query('UPDATE users SET money = 50000, btc = 1.0 WHERE id = ?', [TARGET_USER_ID]);

        console.log('--- TEST SCENARIO READY ---');
        console.log(`User ID: ${TARGET_USER_ID}`);
        console.log('Money: $50,000');
        console.log('BTC: 1.0');
        console.log('Market History: Populated with 21 data points.');
        
    } catch (e) {
        console.error(e);
    } finally {
        db.end();
    }
});

function query(sql, args) {
    return new Promise((resolve, reject) => {
        db.query(sql, args, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
}