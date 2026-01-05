const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database.');

    db.query('SELECT * FROM hospital_active_treatments', (err, results) => {
        if (err) throw err;
        console.log('Active Treatments:', results);
        process.exit();
    });
});
