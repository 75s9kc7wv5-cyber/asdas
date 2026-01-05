const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) { console.error(err); process.exit(1); }
    console.log('Connected.');
    db.query('SHOW TABLES LIKE "hospital_treatments"', (err, res) => {
        if (err) console.error(err);
        else {
            console.log('Tables:', res);
            if (res.length > 0) {
                db.query('DESCRIBE hospital_treatments', (err, cols) => {
                    console.log('Columns:', cols);
                    db.end();
                });
            } else {
                db.end();
            }
        }
    });
});