const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) { console.error('Connection failed:', err); process.exit(1); }
    console.log('Connected to DB');

    const addColumn = "ALTER TABLE hospital_treatments ADD COLUMN user_id INT DEFAULT NULL";
    
    db.query(addColumn, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column user_id already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column user_id added successfully.');
        }
        db.end();
    });
});