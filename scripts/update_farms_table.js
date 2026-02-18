
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const columns = [
        "ADD COLUMN max_workers INT DEFAULT 5",
        "ADD COLUMN salary INT DEFAULT 0",
        "ADD COLUMN vault INT DEFAULT 0",
        "ADD COLUMN stock INT DEFAULT 0",
        "ADD COLUMN reserve INT DEFAULT 0"
    ];

    let completed = 0;
    columns.forEach(col => {
        const sql = `ALTER TABLE player_farms ${col}`;
        db.query(sql, (err) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists: ${col}`);
                } else {
                    console.error(`Error adding column: ${col}`, err.message);
                }
            } else {
                console.log(`Executed: ${sql}`);
            }
            completed++;
            if (completed === columns.length) {
                console.log('All columns processed.');
                process.exit(0);
            }
        });
    });
});
