const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to database.');

    const sql = "ALTER TABLE farm_logs ADD COLUMN earnings DECIMAL(15,2) DEFAULT 0 AFTER amount";

    db.query(sql, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column earnings already exists in farm_logs.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column earnings added successfully to farm_logs.');
        }
        db.end();
    });
});
