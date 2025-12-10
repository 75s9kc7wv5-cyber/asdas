
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
    console.log('Connected to database.');

    const alterMinesQuery = `
        ALTER TABLE player_mines
        ADD COLUMN max_workers INT DEFAULT 5;
    `;

    const createActiveWorkersTable = `
        CREATE TABLE IF NOT EXISTS mine_active_workers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            mine_id INT NOT NULL,
            user_id INT NOT NULL,
            end_time TIMESTAMP NOT NULL,
            FOREIGN KEY (mine_id) REFERENCES player_mines(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `;

    db.query(alterMinesQuery, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Error altering player_mines:', err);
        } else {
            console.log('Column max_workers added to player_mines.');
        }

        db.query(createActiveWorkersTable, (err) => {
            if (err) {
                console.error('Error creating mine_active_workers:', err);
            } else {
                console.log('Table mine_active_workers created.');
            }
            db.end();
        });
    });
});
