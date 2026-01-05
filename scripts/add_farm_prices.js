const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to database.');

    const alterQuery = `
        ALTER TABLE farm_types 
        ADD COLUMN price_gold INT DEFAULT 0,
        ADD COLUMN price_diamond INT DEFAULT 0;
    `;

    db.query(alterQuery, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Columns already exist.');
            } else {
                console.error('Error adding columns:', err);
            }
        } else {
            console.log('Columns added successfully.');
        }

        // Update some values for testing/realism
        // Wheat: Basic (Money only)
        // Corn: Basic (Money only)
        // Cotton: Industrial (Money + Gold)
        // Tomato: Basic (Money only)
        
        // Let's set some arbitrary costs based on existing patterns
        const updates = [
            { slug: 'wheat', gold: 0, diamond: 0 },
            { slug: 'corn', gold: 0, diamond: 0 },
            { slug: 'tomato', gold: 10, diamond: 0 },
            { slug: 'carrot', gold: 20, diamond: 0 },
            { slug: 'cotton', gold: 50, diamond: 5 }
        ];

        let completed = 0;
        updates.forEach(u => {
            db.query('UPDATE farm_types SET price_gold = ?, price_diamond = ? WHERE slug = ?', 
                [u.gold, u.diamond, u.slug], (err) => {
                if (err) console.error(err);
                completed++;
                if (completed === updates.length) {
                    console.log('Prices updated.');
                    process.exit();
                }
            });
        });
        
        // If no updates needed (empty table?), exit
        if (updates.length === 0) process.exit();
    });
});
