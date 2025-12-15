const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    
    const query = "ALTER TABLE player_mines ADD COLUMN raw_material_2 INT DEFAULT 0";
    
    db.query(query, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column raw_material_2 already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column raw_material_2 added successfully.');
        }
        db.end();
    });
});
