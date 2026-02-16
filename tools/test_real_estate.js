const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }
    console.log('Connected to database');
    
    // Check if player_properties table exists
    db.query("SHOW TABLES LIKE 'player_properties'", (err, tables) => {
        if (err) {
            console.error('Error checking tables:', err);
            db.end();
            return;
        }
        
        if (tables.length === 0) {
            console.log('\n❌ player_properties table NOT FOUND');
            console.log('Creating player_properties table...');
            
            const createQuery = `
                CREATE TABLE player_properties (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    business_id INT NOT NULL,
                    type_id INT,
                    income INT DEFAULT 100,
                    duration INT DEFAULT 1,
                    last_collection_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    remaining_life INT DEFAULT 30,
                    pending_income INT DEFAULT 0,
                    name VARCHAR(255),
                    image VARCHAR(255),
                    FOREIGN KEY (business_id) REFERENCES user_businesses(id) ON DELETE CASCADE
                )
            `;
            
            db.query(createQuery, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                } else {
                    console.log('✅ player_properties table created successfully');
                }
                checkBusinessUpgradesTable();
            });
        } else {
            console.log('✅ player_properties table EXISTS');
            
            // Check columns
            db.query("DESCRIBE player_properties", (err, columns) => {
                if (err) {
                    console.error('Error describing table:', err);
                } else {
                    console.log('\nColumns in player_properties:');
                    columns.forEach(col => {
                        console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
                    });
                }
                checkBusinessUpgradesTable();
            });
        }
    });
});

function checkBusinessUpgradesTable() {
    db.query("SHOW TABLES LIKE 'business_upgrades'", (err, tables) => {
        if (err) {
            console.error('Error checking business_upgrades:', err);
            db.end();
            return;
        }
        
        if (tables.length === 0) {
            console.log('\n❌ business_upgrades table NOT FOUND');
            console.log('Creating business_upgrades table...');
            
            const createQuery = `
                CREATE TABLE business_upgrades (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    business_id INT NOT NULL,
                    status VARCHAR(50) DEFAULT 'in_progress',
                    upgrade_end_time DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (business_id) REFERENCES user_businesses(id) ON DELETE CASCADE
                )
            `;
            
            db.query(createQuery, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                } else {
                    console.log('✅ business_upgrades table created successfully');
                }
                finalize();
            });
        } else {
            console.log('✅ business_upgrades table EXISTS');
            finalize();
        }
    });
}

function finalize() {
    setTimeout(() => {
        db.end();
        console.log('\n✅ Database check complete');
    }, 500);
}
