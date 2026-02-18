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
    
    db.query('DESCRIBE player_farms', (err, res) => {
        if(err) console.error('Describe failed:', err);
        else console.log('Columns:', res);
        db.end();
    });
});
