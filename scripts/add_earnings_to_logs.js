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

    const sql = "ALTER TABLE mine_logs ADD COLUMN earnings DECIMAL(15,2) DEFAULT 0 AFTER amount";

    db.query(sql, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column earnings already exists.');
            } else {
                console.error('Error altering table:', err);
            }
        } else {
            console.log('Table mine_logs altered successfully.');
        }
        db.end();
    });
});
