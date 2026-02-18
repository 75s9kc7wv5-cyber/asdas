const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to DB.');

    // 1. Reset User BTC Balance
    db.query('UPDATE users SET btc = 0', (err, result) => {
        if (err) console.error('Error resetting users.btc:', err);
        else console.log(`Updated users.btc for ${result.affectedRows} users.`);

        // 2. Remove BTC from Inventory (if any)
        db.query("DELETE FROM inventory WHERE item_key = 'btc'", (err, result) => {
            if (err) console.error('Error deleting btc inventory:', err);
            else console.log(`Deleted ${result.affectedRows} entries from inventory.`);

            // 3. Clear Active Rigs
            db.query("DELETE FROM player_rigs", (err, result) => {
                if (err) console.error('Error clearing player_rigs:', err);
                else console.log(`Deleted ${result.affectedRows} active rigs.`);

                // 4. Reset Crypto State File
                const stateFile = path.join(__dirname, '../src/data/crypto_state.json');
                const newState = { 
                    totalMined: 0, 
                    floatingBTC: 0,
                    lastPrice: 100 // Reset price to base
                };
                
                try {
                    fs.writeFileSync(stateFile, JSON.stringify(newState, null, 4));
                    console.log('Reset src/data/crypto_state.json to defaults.');
                } catch (e) {
                    console.error('Error resetting state file:', e);
                }

                db.end();
                process.exit();
            });
        });
    });
});
