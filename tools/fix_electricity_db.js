const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected');

    // Rename 'electricity' to 'energy' in factory_inventory
    // Check if 'energy' already exists for that mine to avoid duplicate key error
    // If both exist, sum them up.
    
    // We can do this with a stored procedure or complex query, or just fetch and update.
    // Let's do fetch and update for safety.
    
    db.query('SELECT * FROM factory_inventory WHERE item_key = "electricity"', (err, results) => {
        if (err) throw err;
        
        if (results.length === 0) {
            console.log("No electricity items found.");
            db.end();
            return;
        }
        
        let pending = results.length;
        
        results.forEach(row => {
            const mineId = row.mine_id;
            const amount = row.amount;
            
            // Check if energy exists
            db.query('SELECT * FROM factory_inventory WHERE mine_id = ? AND item_key = "energy"', [mineId], (err, resEnergy) => {
                if (resEnergy.length > 0) {
                    // Update existing energy
                    db.query('UPDATE factory_inventory SET amount = amount + ? WHERE mine_id = ? AND item_key = "energy"', [amount, mineId], (err) => {
                         if (err) console.error(err);
                         // Delete electricity
                         db.query('DELETE FROM factory_inventory WHERE mine_id = ? AND item_key = "electricity"', [mineId], () => {
                             pending--;
                             if(pending===0) db.end();
                         });
                    });
                } else {
                    // Rename electricity to energy
                    db.query('UPDATE factory_inventory SET item_key = "energy" WHERE mine_id = ? AND item_key = "electricity"', [mineId], (err) => {
                         if (err) console.error(err);
                         pending--;
                         if(pending===0) db.end();
                    });
                }
            });
        });
    });
});