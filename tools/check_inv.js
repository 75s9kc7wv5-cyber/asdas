const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected');
    
    db.query('SELECT * FROM factory_inventory WHERE mine_id = 71', (err, results) => {
        if (err) throw err;
        console.log('Inventory for Mine 71:', results);
        db.end();
    });
});