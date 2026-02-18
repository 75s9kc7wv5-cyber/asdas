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
        return;
    }
    console.log('Connected to database.');

    const query = "ALTER TABLE banks ADD COLUMN level INT DEFAULT 1";

    db.query(query, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column level already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column level added successfully.');
        }
        db.end();
    });
});
