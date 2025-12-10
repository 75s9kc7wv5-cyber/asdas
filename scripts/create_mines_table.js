
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

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS player_mines (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            mine_type VARCHAR(50) NOT NULL,
            level INT DEFAULT 1,
            reserve INT DEFAULT 100,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `;

    db.query(createTableQuery, (err) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Table player_mines created or already exists.');
        }
        db.end();
    });
});
