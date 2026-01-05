const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected.');
    db.query('DESCRIBE hospital_treatments', (err, res) => {
        if (err) console.error(err);
        else console.log(res);
        db.end();
    });
});