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
    
    db.query('SELECT * FROM farm_types LIMIT 5', (err, res) => {
        if(err) console.error('Select failed:', err);
        else console.log('Farm Types:', res);
        db.end();
    });
});
