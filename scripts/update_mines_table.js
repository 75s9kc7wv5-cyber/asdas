
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

    const alterTableQuery = `
        ALTER TABLE player_mines
        ADD COLUMN name VARCHAR(100) DEFAULT 'Madenim',
        ADD COLUMN salary INT DEFAULT 100,
        ADD COLUMN vault DECIMAL(15, 2) DEFAULT 0,
        ADD COLUMN stock INT DEFAULT 0,
        ADD COLUMN workers INT DEFAULT 0;
    `;

    const createLogsTableQuery = `
        CREATE TABLE IF NOT EXISTS mine_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            mine_id INT NOT NULL,
            user_id INT NOT NULL,
            amount INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (mine_id) REFERENCES player_mines(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `;

    db.query(alterTableQuery, (err) => {
        if (err) {
            // Ignore duplicate column error if run multiple times
            if (err.code !== 'ER_DUP_FIELDNAME') {
                console.error('Error altering player_mines:', err);
            } else {
                console.log('Columns already exist in player_mines.');
            }
        } else {
            console.log('Table player_mines updated.');
        }

        db.query(createLogsTableQuery, (err) => {
            if (err) {
                console.error('Error creating mine_logs:', err);
            } else {
                console.log('Table mine_logs created.');
            }
            db.end();
        });
    });
});
