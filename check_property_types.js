const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) { console.error(err); process.exit(1); }
    db.query('SELECT * FROM property_types', (err, rows) => {
        if(err) console.error(err);
        else {
            console.log('--- Property Types ---');
            rows.forEach(r => console.log(`${r.id}: ${r.name} (${r.price} TL)`));
        }
        db.end();
    });
});
