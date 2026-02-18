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

    const query = "ALTER TABLE users ADD COLUMN party_role VARCHAR(50) DEFAULT NULL";

    db.query(query, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column party_role already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column party_role added successfully.');
        }
        db.end();
    });
});
