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

    const duration = 2;
    const query = "SELECT NOW() as start_time, DATE_ADD(NOW(), INTERVAL ? MINUTE) as end_time";
    
    db.query(query, [duration], (err, results) => {
        if (err) console.error(err);
        else {
            const row = results[0];
            console.log('Start:', row.start_time);
            console.log('End:  ', row.end_time);
            console.log('Diff (ms):', new Date(row.end_time) - new Date(row.start_time));
        }
        db.end();
    });
});
