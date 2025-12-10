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
    
    db.query('DROP TABLE IF EXISTS hospital_treatments', (err) => {
        if (err) {
            console.error('Error dropping hospital_treatments:', err);
        } else {
            console.log('Dropped hospital_treatments table.');
        }
        db.end();
    });
});
