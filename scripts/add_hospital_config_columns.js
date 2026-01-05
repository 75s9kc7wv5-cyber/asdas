const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected!');

    const queries = [
        "ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS treatment_duration INT DEFAULT 15",
        "ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS health_regen INT DEFAULT 100"
    ];

    let completed = 0;
    queries.forEach(q => {
        db.query(q, (err, result) => {
            if (err) console.error(err);
            else console.log('Column added/checked:', q);
            
            completed++;
            if (completed === queries.length) {
                console.log('All done.');
                process.exit();
            }
        });
    });
});
