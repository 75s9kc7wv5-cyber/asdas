const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) throw err;
    db.query('SELECT id, username, role, party_id, party_role FROM users', (err, results) => {
        if (err) throw err;
        console.table(results);
        db.end();
    });
});
