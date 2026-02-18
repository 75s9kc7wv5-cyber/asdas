const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database.');

    const username = 'admin';

    db.query('SELECT id FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            console.log(`User '${username}' not found.`);
            process.exit();
        }

        const userId = results[0].id;
        console.log(`Found user '${username}' with ID: ${userId}`);

        // Reset Hospital
        const updateHospitalQuery = `
            UPDATE hospitals 
            SET level = 1, capacity = 5, upgrade_end_time = NULL 
            WHERE user_id = ?
        `;

        db.query(updateHospitalQuery, [userId], (err, result) => {
            if (err) throw err;
            console.log(`Hospital for user ${userId} reset to Level 1, Capacity 5.`);
            
            // Give resources for testing
            const updateResourcesQuery = `
                UPDATE users 
                SET money = 10000000, gold = 50000, diamond = 5000, license_hospital_level = 10 
                WHERE id = ?
            `;
            
            db.query(updateResourcesQuery, [userId], (err, result) => {
                 if (err) throw err;
                 console.log(`User ${userId} given resources for testing (Money, Gold, Diamond, License).`);
                 process.exit();
            });
        });
    });
});
