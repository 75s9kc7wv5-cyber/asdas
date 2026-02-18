const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('Connection error:', err);
        return;
    }
    
    db.query('DESCRIBE parties', (err, results) => {
        if (err) {
            console.error('Query error:', err);
        } else {
            console.log(results);
        }
        db.end();
    });
});
