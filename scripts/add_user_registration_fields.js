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
    
    // Yeni kolonları ekle
    const alterQueries = [
        `ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE`,
        `ALTER TABLE users ADD COLUMN phone VARCHAR(50) UNIQUE`,
        `ALTER TABLE users ADD COLUMN ip_address VARCHAR(100)`,
        `ALTER TABLE users ADD COLUMN registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
    ];
    
    let completed = 0;
    alterQueries.forEach((query, index) => {
        db.query(query, (err) => {
            completed++;
            if (err) {
                console.error(`Error executing query ${index + 1}:`, err.message);
            } else {
                console.log(`✓ Query ${index + 1} executed successfully`);
            }
            
            if (completed === alterQueries.length) {
                console.log('\n✅ All columns added successfully!');
                db.end();
                process.exit(0);
            }
        });
    });
});
