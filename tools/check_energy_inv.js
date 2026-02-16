const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    
    // Find items named 'elektrik' or 'electricity'
    db.query("SELECT * FROM inventory WHERE item_key IN ('elektrik', 'electricity')", (err, results) => {
        if (err) throw err;
        console.log('Elektrik/Electricity in Inventory:', results);
        db.end();
    });
});
