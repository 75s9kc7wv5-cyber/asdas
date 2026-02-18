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
    
    // Cookie consent tablosu oluştur
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS cookie_consents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ip_address VARCHAR(100),
            consent BOOLEAN DEFAULT FALSE,
            consent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_agent TEXT,
            INDEX idx_ip (ip_address),
            INDEX idx_date (consent_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    db.query(createTableQuery, (err) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('✓ cookie_consents table created successfully');
        }
        
        db.end();
        process.exit(0);
    });
});
