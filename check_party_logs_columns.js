const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    db.query("SHOW COLUMNS FROM party_logs", (err, result) => {
        if (err) throw err;
        console.log(result.map(c => c.Field));
        process.exit();
    });
});
