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
    
    db.query('SHOW TABLES', (err, results) => {
        if (err) {
            console.error('Error showing tables:', err);
        } else {
            console.log('Tables:', results);
        }
        db.end();
    });
});
