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
    
    db.query('SHOW TABLES', (err, res) => {
        if(err) console.error('Show tables failed:', err);
        else console.log('Tables:', res);
        db.end();
    });
});
