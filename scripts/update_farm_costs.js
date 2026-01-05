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
    console.log('Connected to database.');

    // Update all farm levels to have 100000 money cost
    const sql = 'UPDATE farm_levels SET cost_money = 100000';
    
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Update failed:', err);
            db.end();
            process.exit(1);
        }
        
        console.log('Farm level costs updated successfully.');
        console.log('Rows affected:', result.affectedRows);
        
        db.end();
    });
});
