const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');

    const query = "ALTER TABLE mine_logs ADD COLUMN product_key VARCHAR(50) DEFAULT NULL";
    
    db.query(query, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column product_key added successfully');
        }
        process.exit();
    });
});