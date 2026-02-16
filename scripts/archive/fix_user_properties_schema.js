const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('Connection Failed:', err);
        process.exit(1);
    }
    console.log('Connected.');

    const sql = "ALTER TABLE user_properties ADD COLUMN purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP";

    db.query(sql, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column purchase_date already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column purchase_date added successfully.');
        }

        // Also update existing NULLs
        const updateSql = "UPDATE user_properties SET purchase_date = NOW() WHERE purchase_date IS NULL";
        db.query(updateSql, (err, res) => {
             if(err) console.error(err);
             else console.log(`Updated ${res.affectedRows} rows with NULL purchase_date.`);
             db.end();
        });
    });
});
