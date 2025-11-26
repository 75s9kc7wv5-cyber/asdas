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
    
    db.query('DESCRIBE users', (err, results) => {
        if (err) {
            console.error('Error describing users:', err);
        } else {
            console.log('Users Columns:', results.map(c => c.Field));
        }
        db.end();
    });
});
