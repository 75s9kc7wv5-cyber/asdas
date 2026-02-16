const mysql = require('mysql2');
const db = mysql.createConnection({ host: 'localhost', user: 'simuser', password: 'password', database: 'simworld' });

db.connect(err => {
    if (err) throw err;
    console.log('Connected to DB');

    // 1. Fix Inventory
    db.query("SELECT * FROM inventory WHERE item_key = 'energy'", (err, rows) => {
        if (err) return console.error(err);
        
        let processed = 0;
        if (rows.length === 0) {
            console.log('No energy items in inventory.');
            nextStep();
            return;
        }

        rows.forEach(row => {
            // Check if user already has electricity
            db.query("SELECT * FROM inventory WHERE user_id = ? AND item_key = 'electricity'", [row.user_id], (err, elecRows) => {
                if (elecRows.length > 0) {
                    // Update electricity, delete energy
                    const newQty = elecRows[0].quantity + row.quantity;
                    db.query("UPDATE inventory SET quantity = ? WHERE id = ?", [newQty, elecRows[0].id], (err) => {
                        if (err) console.error(err);
                        db.query("DELETE FROM inventory WHERE id = ?", [row.id], (err) => {
                            if (err) console.error(err);
                            console.log(`Merged energy into electricity for user ${row.user_id} (+${row.quantity})`);
                            processed++;
                            if (processed === rows.length) nextStep();
                        });
                    });
                } else {
                    // Just rename
                    db.query("UPDATE inventory SET item_key = 'electricity' WHERE id = ?", [row.id], (err) => {
                        if (err) console.error(err);
                        console.log(`Renamed energy to electricity for user ${row.user_id}`);
                        processed++;
                        if (processed === rows.length) nextStep();
                    });
                }
            });
        });
    });

    function nextStep() {
        console.log('Checking Factory Inventory...');
        // 2. Fix Factory Inventory
        db.query("SELECT * FROM factory_inventory WHERE item_key = 'energy'", (err, rows) => {
            if (err) return console.error(err);
            
            let processed = 0;
            if (rows.length === 0) {
                console.log('No energy items in factory inventory.');
                finalStep();
                return;
            }

            rows.forEach(row => {
                 db.query("SELECT * FROM factory_inventory WHERE mine_id = ? AND item_key = 'electricity'", [row.mine_id], (err, elecRows) => {
                    if (elecRows.length > 0) {
                        const newQty = elecRows[0].amount + row.amount;
                        db.query("UPDATE factory_inventory SET amount = ? WHERE id = ?", [newQty, elecRows[0].id], (err) => {
                            db.query("DELETE FROM factory_inventory WHERE id = ?", [row.id], (err) => {
                                console.log(`Merged energy into electricity for mine ${row.mine_id}`);
                                processed++;
                                if (processed === rows.length) finalStep();
                            });
                        });
                    } else {
                        db.query("UPDATE factory_inventory SET item_key = 'electricity' WHERE id = ?", [row.id], (err) => {
                            console.log(`Renamed energy to electricity for mine ${row.mine_id}`);
                            processed++;
                            if (processed === rows.length) finalStep();
                        });
                    }
                 });
            });
        });
    }

    function finalStep() {
        console.log('Fixing logs...');
        db.query("UPDATE mine_logs SET product_key = 'electricity' WHERE product_key = 'energy'", (err, res) => {
            console.log('Logs updated:', res.info);
            console.log('Done.');
            db.end();
        });
    }
});
