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
        return;
    }
    console.log('Connected to database.');

    db.query('DESCRIBE banks', (err, results) => {
        if (err) {
            console.error('Error describing table:', err);
        } else {
            console.log('Columns in banks table:');
            results.forEach(row => {
                console.log(row.Field);
            });
        }
        db.end();
    });
});
