const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('DB Connection Error:', err);
        process.exit(1);
    }
    console.log('Connected to DB');

    const updates = [
        "UPDATE users SET role = 'admin' WHERE id = 1",
        "UPDATE users SET role = 'moderator' WHERE id = 2",
        "UPDATE users SET role = 'vip' WHERE id = 3"
    ];

    let completed = 0;

    updates.forEach(query => {
        db.query(query, (err, result) => {
            if (err) {
                console.error('Error executing query:', query, err);
            } else {
                console.log(`Executed: ${query} - Affected Rows: ${result.affectedRows}`);
            }
            completed++;
            if (completed === updates.length) {
                db.end();
            }
        });
    });
});
