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
    console.log('Connected.');

    db.query('DESCRIBE market_listings', (err, results) => {
        if (err) {
            console.error('Error describing table:', err.message);
        } else {
            console.log('Table schema:', results);
        }

        db.query('SELECT * FROM market_listings LIMIT 1', (err, res) => {
             if(err) console.error('Select error:', err.message);
             else console.log('Select success:', res);
             db.end();
        });
    });
});
