const mysql = require('mysql2');
// require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('DB Connection Error:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS market_listings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            seller_id INT NOT NULL,
            item_id VARCHAR(50) NOT NULL,
            quantity INT NOT NULL,
            price INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;

    db.query(createTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating market_listings table:', err);
        } else {
            console.log('market_listings table created or already exists.');
        }
        
        // Add some dummy data for testing
        const dummyData = [
            [1, 'iron', 100, 5],
            [1, 'iron', 500, 4],
            [1, 'food', 200, 10],
            [1, 'gold', 5, 1000]
        ];

        // Check if we have users first to avoid FK errors
        db.query('SELECT id FROM users LIMIT 1', (err, users) => {
            if (err || users.length === 0) {
                console.log('No users found, skipping dummy data.');
                db.end();
                return;
            }
            
            const userId = users[0].id;
            const dummyWithUser = dummyData.map(d => [userId, ...d.slice(1)]);

            const insertQuery = `INSERT INTO market_listings (seller_id, item_id, quantity, price) VALUES ?`;
            db.query(insertQuery, [dummyWithUser], (err, res) => {
                if (err) console.error('Error inserting dummy data:', err);
                else console.log('Dummy market data inserted.');
                db.end();
            });
        });
    });
});
