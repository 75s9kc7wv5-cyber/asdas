const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) { console.error('Connection failed:', err); process.exit(1); }
    console.log('Connected to DB');

    db.query('SELECT NOW() as db_now', (err, results) => {
        if (err) console.error(err);
        else {
            const dbNow = results[0].db_now;
            const jsNow = new Date();
            console.log('DB NOW:', dbNow);
            console.log('JS NOW:', jsNow);
            console.log('Difference (ms):', jsNow - dbNow);
        }
        db.end();
    });
});
