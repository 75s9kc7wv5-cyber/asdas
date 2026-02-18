const mysql = require('mysql2');

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
    console.log('Connected to database.');

    // Remove foreign key checks to allow truncation if there are constraints
    db.query('SET FOREIGN_KEY_CHECKS = 0', (err) => {
        if (err) {
            console.error('Failed to disable foreign key checks:', err);
            process.exit(1);
        }

        // 1. Reset users' party data
        console.log('Resetting users party data...');
        db.query('UPDATE users SET party_id = NULL', (err, res) => {
            if (err) console.error('Error updating users:', err);
            else console.log(`Updated ${res.changedRows} users.`);

            // 2. Clear party_applications
            console.log('Clearing party_applications table...');
            db.query('TRUNCATE TABLE party_applications', (err, res) => {
                if (err) console.error('Error truncating party_applications (table might not exist):', err);
                else console.log('party_applications table cleared.');

                // 3. Clear party_logs
                console.log('Clearing party_logs table...');
                db.query('TRUNCATE TABLE party_logs', (err, res) => {
                    if (err) console.error('Error truncating party_logs (table might not exist):', err);
                    else console.log('party_logs table cleared.');

                    // 4. Clear parties
                    console.log('Clearing parties table...');
                    db.query('TRUNCATE TABLE parties', (err, res) => {
                        if (err) console.error('Error truncating parties:', err);
                        else console.log('parties table cleared.');

                        // Re-enable foreign key checks
                        db.query('SET FOREIGN_KEY_CHECKS = 1', (err) => {
                            if (err) console.error('Failed to enable foreign key checks:', err);
                            console.log('Done.');
                            db.end();
                        });
                    });
                });
            });
        });
    });
});
