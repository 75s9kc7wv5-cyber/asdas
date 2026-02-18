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

    const queries = [
        // 1. Create property_types table
        `CREATE TABLE IF NOT EXISTS property_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            cost_money INT DEFAULT 0,
            cost_gold INT DEFAULT 0,
            cost_diamond INT DEFAULT 0,
            req_materials JSON,
            tax_income INT DEFAULT 100,
            tax_interval INT DEFAULT 3600,
            image VARCHAR(255)
        )`,

        // 2. Add license_property_level to users if not exists
        `SET @dbname = DATABASE();
        SET @tablename = "users";
        SET @columnname = "license_property_level";
        SET @preparedStatement = (SELECT IF(
          (
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE
              (table_name = @tablename)
              AND (table_schema = @dbname)
              AND (column_name = @columnname)
          ) > 0,
          "SELECT 1",
          "ALTER TABLE users ADD COLUMN license_property_level INT DEFAULT 1"
        ));
        PREPARE alterIfNotExists FROM @preparedStatement;
        EXECUTE alterIfNotExists;
        DEALLOCATE PREPARE alterIfNotExists;`,

        // 3. Add last_tax_collected to player_properties if not exists
        `SET @dbname = DATABASE();
        SET @tablename = "player_properties";
        SET @columnname = "last_tax_collected";
        SET @preparedStatement = (SELECT IF(
          (
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE
              (table_name = @tablename)
              AND (table_schema = @dbname)
              AND (column_name = @columnname)
          ) > 0,
          "SELECT 1",
          "ALTER TABLE player_properties ADD COLUMN last_tax_collected TIMESTAMP NULL"
        ));
        PREPARE alterIfNotExists FROM @preparedStatement;
        EXECUTE alterIfNotExists;
        DEALLOCATE PREPARE alterIfNotExists;`,
        
        // 4. Clear existing property types to avoid duplicates (optional, but good for setup)
        `TRUNCATE TABLE property_types`,

        // 5. Insert 10 Property Types
        `INSERT INTO property_types (name, cost_money, cost_gold, cost_diamond, req_materials, tax_income, tax_interval, image) VALUES 
        ('Gecekondu', 5000, 0, 0, '{"wood": 50, "stone": 20}', 500, 3600, 'icons/property-icon/shack.png'),
        ('Ahşap Ev', 15000, 0, 0, '{"wood": 150, "stone": 50, "glass": 10, "brick": 20}', 1200, 3600, 'icons/property-icon/wooden-house.png'),
        ('Betonarme Ev', 30000, 0, 0, '{"concrete": 50, "brick": 100, "glass": 20, "steel": 10}', 2500, 3600, 'icons/property-icon/concrete-house.png'),
        ('Apartman Dairesi', 75000, 10, 0, '{"concrete": 150, "steel": 20, "glass": 50, "brick": 50, "lumber": 20}', 5000, 3600, 'icons/property-icon/apartment.png'),
        ('Müstakil Villa', 150000, 50, 0, '{"concrete": 300, "steel": 50, "lumber": 100, "glass": 50, "brick": 100}', 12000, 3600, 'icons/property-icon/villa.png'),
        ('Lüks Rezidans', 300000, 150, 0, '{"concrete": 500, "steel": 150, "glass": 200, "lumber": 50, "brick": 200}', 25000, 3600, 'icons/property-icon/residence.png'),
        ('İş Merkezi', 750000, 500, 0, '{"concrete": 1000, "steel": 500, "glass": 500, "brick": 500}', 60000, 3600, 'icons/property-icon/business-center.png'),
        ('Gökdelen', 2000000, 1500, 0, '{"concrete": 2500, "steel": 1500, "glass": 1500, "lumber": 200}', 150000, 3600, 'icons/property-icon/skyscraper.png'),
        ('Saray', 5000000, 5000, 10, '{"concrete": 5000, "steel": 2000, "gold": 100, "glass": 500}', 400000, 3600, 'icons/property-icon/palace.png'),
        ('Uzay İstasyonu', 20000000, 20000, 100, '{"steel": 10000, "glass": 5000, "uranium": 500}', 2000000, 3600, 'icons/property-icon/space-station.png')`
    ];

    let completed = 0;
    queries.forEach((query, index) => {
        db.query(query, (err, result) => {
            if (err) {
                console.error(`Query ${index + 1} failed:`, err);
            } else {
                console.log(`Query ${index + 1} success.`);
            }
            completed++;
            if (completed === queries.length) {
                console.log('All queries executed.');
                db.end();
            }
        });
    });
});
