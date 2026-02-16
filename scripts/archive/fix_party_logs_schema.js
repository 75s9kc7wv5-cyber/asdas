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

    const addMessageColumn = "ALTER TABLE party_logs ADD COLUMN message TEXT AFTER amount";

    db.query(addMessageColumn, (err) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('message column already exists.');
            } else {
                console.error('Error adding message column:', err);
            }
        } else {
            console.log('message column added to party_logs.');
        }
        db.end();
    });
});
