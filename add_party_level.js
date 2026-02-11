const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('Connection error:', err);
        return;
    }
    
    // Add level column
    db.query("ALTER TABLE parties ADD COLUMN level INT DEFAULT 1", (err, result) => {
        if (err) {
            // Ignore if exists (error code 1060)
            if (err.errno === 1060) {
                console.log('Level column already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Level column added.');
        }
        db.end();
    });
});
