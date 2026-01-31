const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

// Tier 1 (1 min) to Tier 10 (10 min)
const tiers = [
    { ids: [1, 11], time: 60 },
    { ids: [2, 12], time: 120 },
    { ids: [3, 13], time: 180 },
    { ids: [4, 14], time: 240 },
    { ids: [5, 15], time: 300 },
    { ids: [6, 16], time: 360 },
    { ids: [7, 17], time: 420 },
    { ids: [8, 18], time: 480 },
    { ids: [9, 19], time: 540 },
    { ids: [10, 20], time: 600 }
];

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to DB');

    let completed = 0;
    
    tiers.forEach(tier => {
        tier.ids.forEach(id => {
            db.query(
                'UPDATE property_types SET tax_interval = ? WHERE id = ?',
                [tier.time, id],
                (err, res) => {
                    if (err) console.error(`Error updating ID ${id}:`, err);
                    else console.log(`Updated ID ${id}: Interval ${tier.time}s`);
                }
            );
        });
    });

    // Give it a moment to finish async queries
    setTimeout(() => {
        console.log('Done');
        process.exit();
    }, 2000);
});
