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
    console.log('Connected!');

    const queries = [
        "ALTER TABLE player_ranches ADD COLUMN vault INT DEFAULT 0",
        "ALTER TABLE player_ranches ADD COLUMN stock INT DEFAULT 0",
        "ALTER TABLE player_ranches ADD COLUMN reserve INT DEFAULT 10000"
    ];

    let completed = 0;
    queries.forEach(query => {
        db.query(query, (err) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column already exists, skipping.');
                } else {
                    console.error('Query failed:', err.message);
                }
            } else {
                console.log('Query success');
            }
            
            completed++;
            if (completed === queries.length) {
                console.log('All done');
                db.end();
            }
        });
    });
});
