
const mysql = require('mysql2');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to DB');

    db.query('SELECT * FROM factory_inventory WHERE item_key = "electricity"', (err, results) => {
        if (err) throw err;
        console.log('Found electricity entries in factory_inventory:', results.length);
        if (results.length > 0) {
            console.log('Migrating electricity to energy in factory_inventory...');
            // Need to handle duplicates if energy already exists for that mine
            // But for simple migration let's just update and let it fail if duplicate? No, better use ON DUPLICATE KEY logic or something smart.
            // Or just UPDATE IGNORE and then delete?
            
            // Standard update:
            // UPDATE factory_inventory SET item_key = 'energy' WHERE item_key = 'electricity';
            // This will fail if (mine_id, 'energy') already exists.
            
            // So we iterate and upsert.
            let processed = 0;
            results.forEach(row => {
               db.query('SELECT * FROM factory_inventory WHERE mine_id = ? AND item_key = "energy"', [row.mine_id], (err, exists) => {
                   if(exists.length > 0) {
                       // energy exists, add amount and delete electricity
                       const newAmount = row.amount + exists[0].amount;
                       db.query('UPDATE factory_inventory SET amount = ? WHERE id = ?', [newAmount, exists[0].id], (err)=>{});
                       db.query('DELETE FROM factory_inventory WHERE id = ?', [row.id], (err)=>{});
                   } else {
                       // just rename
                       db.query('UPDATE factory_inventory SET item_key = "energy" WHERE id = ?', [row.id], (err)=>{});
                   }
                   processed++;
                   if(processed === results.length) {
                       console.log('Migration done.');
                       process.exit();
                   }
               });
            });
        } else {
            console.log('No migration needed.');
            process.exit();
        }
    });
});
