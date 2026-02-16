const mysql = require('mysql2');
// require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    db.query('DESCRIBE parties', (err, res) => {
        if (err) console.error(err);
        else console.log(res);
        db.end();
    });
});