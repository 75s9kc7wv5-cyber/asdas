const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected.');

    db.query('UPDATE users SET btc = 0', (err, result) => {
        if (err) {
            console.error('Error resetting BTC:', err);
        } else {
            console.log(`Updated BTC for ${result.affectedRows} users.`);
        }
        db.end();
        process.exit();
    });
});
