const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('DB connect fail:', err);
        process.exit(1);
    }
    console.log('Connected');
    db.query('DESCRIBE banks', (err, results) => {
        if (err) console.error(err);
        else console.log(results);
        process.exit();
    });
});
