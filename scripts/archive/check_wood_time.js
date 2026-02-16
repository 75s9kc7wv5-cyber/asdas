const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    
    db.query('SELECT * FROM mine_settings WHERE mine_type = "wood"', (err, results) => {
        if (err) console.error(err);
        else console.log('Wood Settings:', results);
        db.end();
    });
});
