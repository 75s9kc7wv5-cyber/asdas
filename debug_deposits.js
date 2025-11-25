const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect();

db.query('SELECT * FROM bank_deposits', (err, deposits) => {
    if (err) console.error(err);
    else {
        console.log('Deposits:', deposits);
        if (deposits.length > 0) {
            const bankId = deposits[0].bank_id;
            db.query('SELECT * FROM banks WHERE id = ?', [bankId], (err, banks) => {
                if (err) console.error(err);
                else console.log('Bank for first deposit:', banks);
                db.end();
            });
        } else {
            console.log('No deposits found.');
            db.end();
        }
    }
});
