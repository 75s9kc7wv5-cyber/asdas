const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('DB Connection Failed:', err);
        process.exit(1);
    }
    console.log('Connected to DB');

    const queries = [
        // Add Real Estate columns to user_business
        // We split them to handle errors individually if columns exist
        `ALTER TABLE user_business ADD COLUMN real_estate_balance DECIMAL(15,2) DEFAULT 0`,
        `ALTER TABLE user_business ADD COLUMN real_estate_level INT DEFAULT 1`,
        `ALTER TABLE user_business ADD COLUMN real_estate_upgrade_end_time DATETIME DEFAULT NULL`,

        // Create user_properties table
        `CREATE TABLE IF NOT EXISTS user_properties (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            property_type_id INT NOT NULL,
            purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_collection_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX (user_id)
        )`,

        // Ensure property_types has necessary columns
        // Try creating first
        `CREATE TABLE IF NOT EXISTS property_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            image VARCHAR(255)
        )`,
        
        // Add columns to property_types
        `ALTER TABLE property_types ADD COLUMN price DECIMAL(15,2) DEFAULT 0`,
        `ALTER TABLE property_types ADD COLUMN income DECIMAL(15,2) DEFAULT 0`,
        `ALTER TABLE property_types ADD COLUMN duration_hours INT DEFAULT 1`,
        
        // Insert/Update default property types
        `INSERT INTO property_types (id, name, image, price, income, duration_hours) VALUES 
        (1, 'Arsa', 'icons/property-icon/tarla.png', 50000, 500, 1),
        (2, 'Ev', 'icons/property-icon/ev.png', 150000, 1200, 2),
        (3, 'Apartman', 'icons/property-icon/apartman.png', 500000, 3500, 4),
        (4, 'Kahve Dükkanı', 'icons/property-icon/kahve dükkanı.png', 1200000, 7500, 6),
        (5, 'Ofis', 'icons/property-icon/ofis.png', 2500000, 15000, 8),
        (6, 'Otel', 'icons/property-icon/otel.png', 5000000, 35000, 12),
        (7, 'Alışveriş Merkezi', 'icons/property-icon/alısveris-merkezi.png', 15000000, 90000, 24)
        ON DUPLICATE KEY UPDATE price=VALUES(price), income=VALUES(income), duration_hours=VALUES(duration_hours)`
    ];

    let completed = 0;
    queries.forEach(query => {
        db.query(query, (err) => {
            if (err) {
                // Ignore "Column already exists" (1060) or "Table already exists" (1050)
                if (err.errno === 1060 || err.errno === 1050) {
                     console.log('Column/Table already exists, skipping.');
                } else {
                     console.error('Query Failed:', err.message);
                }
            } else {
                console.log('Query Executed');
            }
            
            completed++;
            if (completed === queries.length) {
                console.log('All Done');
                process.exit(0);
            }
        });
    });
});
