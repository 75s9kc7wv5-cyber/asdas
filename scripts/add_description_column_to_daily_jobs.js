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
    console.log('Connected to DB');

    const alterQuery = "ALTER TABLE daily_jobs ADD COLUMN description TEXT DEFAULT NULL AFTER name";

    db.query(alterQuery, (err, result) => {
        if (err) {
            // efficient check if column already exists (error code 1060)
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column description already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column description added successfully.');
        }
        db.end();
    });
});
