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

    // 1. Add license_ranch_level to users if not exists
    const checkColumn = "SHOW COLUMNS FROM users LIKE 'license_ranch_level'";
    db.query(checkColumn, (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            const addColumn = "ALTER TABLE users ADD COLUMN license_ranch_level INT DEFAULT 1";
            db.query(addColumn, (err) => {
                if (err) throw err;
                console.log('Added license_ranch_level to users.');
                proceedToRanchTypes();
            });
        } else {
            console.log('license_ranch_level already exists.');
            proceedToRanchTypes();
        }
    });
});

function proceedToRanchTypes() {
    // 2. Create ranch_types table
    const createRanchTypes = `
        CREATE TABLE IF NOT EXISTS ranch_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            slug VARCHAR(50) NOT NULL UNIQUE,
            price INT NOT NULL,
            gold_price INT DEFAULT 0,
            diamond_price INT DEFAULT 0,
            license_req INT NOT NULL,
            image_path VARCHAR(255),
            description TEXT
        )
    `;

    db.query(createRanchTypes, (err) => {
        if (err) throw err;
        console.log('ranch_types table ready.');

        // 3. Insert Data
        const types = [
            ['Tavuk Kümesi', 'chicken', 10000, 0, 0, 1, 'icons/ranch-icon/chicken.png', 'Yumurta üretimi için.'],
            ['Koyun Ağılı', 'sheep', 15000, 0, 0, 2, 'icons/ranch-icon/sheep.png', 'Yün üretimi için.'],
            ['Arı Kovanı', 'bee', 12000, 0, 0, 3, 'icons/ranch-icon/bee.png', 'Bal üretimi için.'],
            ['İnek Çiftliği', 'cow', 25000, 5, 0, 5, 'icons/ranch-icon/cow.png', 'Süt üretimi için.']
        ];

        let completed = 0;
        types.forEach(type => {
            const sql = "INSERT IGNORE INTO ranch_types (name, slug, price, gold_price, diamond_price, license_req, image_path, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            db.query(sql, type, (err) => {
                if (err) console.error(err);
                completed++;
                if (completed === types.length) {
                    console.log('Ranch types inserted.');
                    proceedToPlayerRanches();
                }
            });
        });
    });
}

function proceedToPlayerRanches() {
    // 4. Create player_ranches table
    const createPlayerRanches = `
        CREATE TABLE IF NOT EXISTS player_ranches (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            ranch_type_id INT NOT NULL,
            level INT DEFAULT 1,
            current_workers INT DEFAULT 0,
            max_workers INT DEFAULT 5,
            salary INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (ranch_type_id) REFERENCES ranch_types(id)
        )
    `;

    db.query(createPlayerRanches, (err) => {
        if (err) throw err;
        console.log('player_ranches table ready.');
        process.exit(0);
    });
}
