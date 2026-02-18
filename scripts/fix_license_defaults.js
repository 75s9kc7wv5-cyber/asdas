const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const queries = [
        "ALTER TABLE users ALTER COLUMN license_hospital_level SET DEFAULT 0",
        "ALTER TABLE users ALTER COLUMN license_farm_level SET DEFAULT 0",
        "ALTER TABLE users ALTER COLUMN license_ranch_level SET DEFAULT 0",
        "ALTER TABLE users ALTER COLUMN license_property_level SET DEFAULT 0"
    ];

    let completed = 0;
    
    queries.forEach(query => {
        db.query(query, (err) => {
            if (err) console.error('Error executing query:', query, err);
            else console.log('Success:', query);
            
            completed++;
            if (completed === queries.length) {
                console.log('All updates completed.');
                
                // Optionally verify
                db.query("DESCRIBE users", (err, result) => {
                    if(!err) {
                        const hospital = result.find(r => r.Field === 'license_hospital_level');
                        console.log('New Default for license_hospital_level:', hospital ? hospital.Default : 'Not Found');
                    }
                    db.end();
                });
            }
        });
    });
});
