
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to database.');

    db.query('SELECT * FROM property_types', (err, results) => {
        if (err) throw err;
        console.log(JSON.stringify(results, null, 2));
        db.end();
    });
});
