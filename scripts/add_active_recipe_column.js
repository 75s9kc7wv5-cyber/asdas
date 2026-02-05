const mysql = require('mysql2');
// require('dotenv').config();

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

    const sql = "ALTER TABLE player_mines ADD COLUMN active_recipe_id VARCHAR(50) DEFAULT NULL";

    db.query(sql, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column active_recipe_id already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column active_recipe_id added successfully.');
        }
        db.end();
    });
});
