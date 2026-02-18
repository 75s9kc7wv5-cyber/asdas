const mysql = require('mysql2');
const db = mysql.createConnection({ host: 'localhost', user: 'simuser', password: 'password', database: 'simworld' });

db.connect(err => {
    if (err) throw err;
    console.log('Connected to DB');

    // 1. Update inventory
    db.query("UPDATE inventory SET item_key = 'electricity' WHERE item_key = 'energy'", (err, res) => {
        if (err) console.error('Inventory Update Error:', err);
        else console.log('Inventory Updated:', res.info);

        // 2. Update factory_inventory
        db.query("UPDATE factory_inventory SET item_key = 'electricity' WHERE item_key = 'energy'", (err, res) => {
            if (err) console.error('Factory Inventory Update Error:', err);
            else console.log('Factory Inventory Updated:', res.info);

            // 3. Update mine_logs
            db.query("UPDATE mine_logs SET product_key = 'electricity' WHERE product_key = 'energy'", (err, res) => {
                if (err) console.error('Logs Update Error:', err);
                else console.log('Logs Updated:', res.info);
                
                db.end();
            });
        });
    });
});
