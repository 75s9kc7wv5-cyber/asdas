const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected!');
    
    db.query('SHOW TABLES LIKE "parties"', (err, res) => {
        if(err) console.error('Show tables failed:', err);
        else {
            console.log('Parties Table Check:', res);
            if (res.length > 0) {
                db.query('DESCRIBE parties', (err, desc) => {
                    if(err) console.error('Describe failed:', err);
                    else console.log('Schema:', desc);
                    db.end();
                });
            } else {
                console.log('Parties table does not exist.');
                db.end();
            }
        }
    });
});
