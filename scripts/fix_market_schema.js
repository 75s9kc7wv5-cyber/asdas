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
    console.log('Connected.');

    // Rename item_id to item_key
    const query = "ALTER TABLE market_listings CHANGE item_id item_key VARCHAR(50) NOT NULL";
    
    db.query(query, (err, result) => {
        if (err) {
            console.error('Error altering table:', err.message);
        } else {
            console.log('Table schema updated successfully:', result);
        }
        db.end();
    });
});
