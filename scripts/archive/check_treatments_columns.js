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
    
    db.query('DESCRIBE hospital_treatments', (err, results) => {
        if (err) {
            console.error('Error describing hospital_treatments:', err);
        } else {
            console.log('hospital_treatments Columns:', results);
        }
        db.end();
    });
});
