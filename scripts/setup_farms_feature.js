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

    // 1. Add license_farm_level to users if not exists
    const checkColumn = "SHOW COLUMNS FROM users LIKE 'license_farm_level'";
    db.query(checkColumn, (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            const addColumn = "ALTER TABLE users ADD COLUMN license_farm_level INT DEFAULT 1";
            db.query(addColumn, (err) => {
                if (err) throw err;
                console.log('Added license_farm_level to users.');
                proceedToFarmTypes();
            });
        } else {
            console.log('license_farm_level already exists.');
            proceedToFarmTypes();
        }
    });
});

function proceedToFarmTypes() {
    // 2. Create farm_types table
    const createFarmTypes = `
        CREATE TABLE IF NOT EXISTS farm_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            slug VARCHAR(50) NOT NULL UNIQUE,
            price INT NOT NULL,
            license_req INT NOT NULL,
            image_path VARCHAR(255),
            description TEXT
        )
    `;

    db.query(createFarmTypes, (err) => {
        if (err) throw err;
        console.log('farm_types table ready.');

        // 3. Insert Data
        const types = [
            ['Tavuk Çiftliği', 'chicken_farm', 5000, 1, 'icons/farm-icon/chicken.png', 'Yumurta üretimi için temel çiftlik.'],
            ['İnek Çiftliği', 'cow_farm', 15000, 2, 'icons/farm-icon/cow.png', 'Süt üretimi için gelişmiş çiftlik.'],
            ['Koyun Çiftliği', 'sheep_farm', 10000, 2, 'icons/farm-icon/sheep.png', 'Yün üretimi için çiftlik.'],
            ['Arı Çiftliği', 'bee_farm', 25000, 3, 'icons/farm-icon/bee.png', 'Bal üretimi için özel çiftlik.']
        ];

        let completed = 0;
        types.forEach(type => {
            const sql = "INSERT IGNORE INTO farm_types (name, slug, price, license_req, image_path, description) VALUES (?, ?, ?, ?, ?, ?)";
            db.query(sql, type, (err) => {
                if (err) console.error(err);
                completed++;
                if (completed === types.length) {
                    console.log('Farm types inserted.');
                    proceedToPlayerFarms();
                }
            });
        });
    });
}

function proceedToPlayerFarms() {
    // 4. Create player_farms table
    const createPlayerFarms = `
        CREATE TABLE IF NOT EXISTS player_farms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            farm_type_id INT NOT NULL,
            level INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (farm_type_id) REFERENCES farm_types(id)
        )
    `;

    db.query(createPlayerFarms, (err) => {
        if (err) throw err;
        console.log('player_farms table ready.');
        process.exit(0);
    });
}
