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

    const sql = "ALTER TABLE player_mines ADD COLUMN is_upgrading BOOLEAN DEFAULT FALSE;";
    
    db.query(sql, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column added successfully');
        }
        db.end();
    });
});
