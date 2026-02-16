const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) console.error(err);
    
    db.query('DESCRIBE active_daily_jobs', (err, res) => {
        console.log('Active:', res);
        db.query('DESCRIBE completed_daily_jobs', (err, res) => {
            console.log('Completed:', res);
            db.end();
        });
    });
});
