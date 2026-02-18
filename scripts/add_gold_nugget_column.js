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
    
    const query = "ALTER TABLE users ADD COLUMN gold_nugget INT DEFAULT 0;";
    
    db.query(query, (err) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column gold_nugget added to users table.');
        }
        db.end();
    });
});
