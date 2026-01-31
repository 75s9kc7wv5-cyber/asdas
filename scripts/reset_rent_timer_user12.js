const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to DB');

    const userId = 12;

    // Check if user has properties first
    db.query('SELECT props.id, props.name, types.tax_interval FROM player_properties props JOIN property_types types ON props.property_type_id = types.id WHERE props.user_id = ?', [userId], (err, results) => {
        if(err) throw err;

        if (results.length === 0) {
            console.log(`User ${userId} has no properties. Cannot reset rent timer.`);
            process.exit();
        }

        console.log(`Found ${results.length} properties for User ${userId}. Resetting timers...`);

        // Update last_tax_collected to 2 days ago
        db.query(`UPDATE player_properties SET last_tax_collected = DATE_SUB(NOW(), INTERVAL 2 DAY) WHERE user_id = ?`, [userId], (err, res) => {
             if(err) throw err;
             console.log(`Updated ${res.changedRows} properties. Rent should be ready.`);
             process.exit();
        });
    });
});
