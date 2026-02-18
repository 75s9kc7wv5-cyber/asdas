const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const query = 'UPDATE hospitals SET level = 1';
    
    db.query(query, (err, result) => {
        if (err) {
            console.error('Error updating hospital levels:', err);
        } else {
            console.log(`Successfully updated hospital levels. Affected rows: ${result.affectedRows}`);
        }
        db.end();
    });
});
