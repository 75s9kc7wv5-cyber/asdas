const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld',
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const queries = [
        // 1. Users tablosuna mute_expires_at ekle
        "ALTER TABLE users ADD COLUMN mute_expires_at TIMESTAMP NULL DEFAULT NULL;",
        
        // 2. Chat messages tablosuna is_deleted ekle
        "ALTER TABLE chat_messages ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;",
        
        // 3. Raporlar tablosunu oluştur
        `CREATE TABLE IF NOT EXISTS message_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message_id INT NOT NULL,
            reporter_id INT NOT NULL,
            reason VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
            FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
        );`
    ];

    let completed = 0;

    queries.forEach((query) => {
        db.query(query, (err) => {
            if (err) {
                // Sütun zaten varsa hata verebilir, bunu görmezden gelelim (basitlik için)
                console.log('Query executed (might be duplicate column):', err.code);
            } else {
                console.log('Query success.');
            }
            completed++;
            if (completed === queries.length) {
                console.log('All updates finished.');
                db.end();
            }
        });
    });
});
