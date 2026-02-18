const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    db.query('SHOW COLUMNS FROM market_listings', (err, results) => {
        if (err) console.error(err);
        else console.log(results);
        db.end();
    });
});
