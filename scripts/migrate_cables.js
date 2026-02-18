const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(async err => {
    if (err) throw err;
    console.log('Connected to DB');

    // 1. Get all entries with 'cable'
    db.query('SELECT * FROM factory_inventory WHERE item_key = "cable"', (err, cableRows) => {
        if (err) { console.error(err); return; }

        if (cableRows.length === 0) {
            console.log('No legacy cable entries found.');
            db.end();
            return;
        }

        console.log(`Found ${cableRows.length} legacy cable entries.`);

        let processed = 0;
        cableRows.forEach(row => {
            // Check if copper_cable exists for this mine_id
            db.query('SELECT * FROM factory_inventory WHERE mine_id = ? AND item_key = "copper_cable"', [row.mine_id], (err, res) => {
                if (err) console.error(err);

                if (res.length > 0) {
                    // It exists, so add amount to it and delete 'cable'
                    const existingAmount = res[0].amount;
                    const amountToAdd = row.amount;
                    
                    console.log(`Mine ${row.mine_id}: Merging ${amountToAdd} cable into ${existingAmount} copper_cable.`);

                    db.query('UPDATE factory_inventory SET amount = amount + ? WHERE mine_id = ? AND item_key = "copper_cable"', [amountToAdd, row.mine_id], (err) => {
                         if (err) console.error(err);
                         // Delete the old row
                         db.query('DELETE FROM factory_inventory WHERE mine_id = ? AND item_key = "cable"', [row.mine_id], (err) => {
                             if(err) console.error(err);
                             checkDone();
                         });
                    });

                } else {
                    // It does not exist, so just rename it
                    console.log(`Mine ${row.mine_id}: Renaming "cable" to "copper_cable".`);
                    db.query('UPDATE factory_inventory SET item_key = "copper_cable" WHERE mine_id = ? AND item_key = "cable"', [row.mine_id], (err) => {
                         if (err) console.error(err);
                         checkDone();
                    });
                }
            });
        });

        function checkDone() {
            processed++;
            if (processed === cableRows.length) {
                console.log('Migration complete.');
                db.end();
            }
        }
    });
});
