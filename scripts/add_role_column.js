const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('DB Connection Error:', err);
        process.exit(1);
    }
    console.log('Connected to DB');

    const query = "ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'";

    db.query(query, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column role already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column role added successfully.');
        }
        db.end();
    });
});
