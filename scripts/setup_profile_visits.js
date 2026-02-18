const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database.');

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS profile_visits (
            id INT AUTO_INCREMENT PRIMARY KEY,
            profile_id INT NOT NULL,
            visitor_id INT NOT NULL,
            visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (profile_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (visitor_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;

    db.query(createTableQuery, (err, result) => {
        if (err) throw err;
        console.log('profile_visits table created or already exists.');
        process.exit();
    });
});
