const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected.');

    const sql = "ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT 'default-avatar.png'";
    
    db.query(sql, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists.');
            } else {
                console.error(err);
            }
        } else {
            console.log('Avatar column added.');
        }
        process.exit();
    });
});
