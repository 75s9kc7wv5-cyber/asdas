const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('DB Connection Error:', err);
        process.exit(1);
    }
    console.log('Connected to DB');

    db.query('DESCRIBE party_logs', (err, results) => {
        if (err) {
            console.error('Query Error:', err);
        } else {
            console.log('party_logs Schema:', results);
        }
        db.end();
    });
});
