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
    
    const createTable = `
        CREATE TABLE IF NOT EXISTS user_businesses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            business_type VARCHAR(50) NOT NULL,
            level INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_business (user_id, business_type)
        )
    `;

    db.query(createTable, (err) => {
        if (err) {
            console.error('Error creating user_businesses table:', err);
        } else {
            console.log('user_businesses table created/verified');
        }
        db.end();
    });
});
