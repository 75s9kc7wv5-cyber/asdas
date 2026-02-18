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

    const query = "ALTER TABLE users ADD COLUMN profile_views INT DEFAULT 0";

    db.query(query, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column profile_views already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column profile_views added successfully.');
        }
        db.end();
    });
});
