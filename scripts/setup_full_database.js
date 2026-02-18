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
        // 1. Users Table
        `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            avatar VARCHAR(255) DEFAULT 'uploads/avatars/default.png',
            role VARCHAR(50) DEFAULT 'user',
            money DECIMAL(15, 2) DEFAULT 1000,
            gold INT DEFAULT 0,
            diamond INT DEFAULT 0,
            energy INT DEFAULT 100,
            health INT DEFAULT 100,
            level INT DEFAULT 1,
            xp INT DEFAULT 0,
            education_skill INT DEFAULT 1,
            license_hospital_level INT DEFAULT 0,
            license_farm_level INT DEFAULT 0,
            license_ranch_level INT DEFAULT 0,
            license_property_level INT DEFAULT 1,
            party_id INT DEFAULT NULL,
            profile_views INT DEFAULT 0,
            last_login DATETIME DEFAULT NULL,
            mute_expires_at TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // 2. Notifications
        `CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT,
            type VARCHAR(50),
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // 3. Toxic Logs
        `CREATE TABLE IF NOT EXISTS toxic_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            original_message TEXT,
            filtered_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // 4. Profile Visits
        `CREATE TABLE IF NOT EXISTS profile_visits (
            id INT AUTO_INCREMENT PRIMARY KEY,
            profile_id INT NOT NULL,
            visitor_id INT NOT NULL,
            visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (profile_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (visitor_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // 5. Profile Comments
        `CREATE TABLE IF NOT EXISTS profile_comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            profile_user_id INT NOT NULL,
            author_user_id INT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (profile_user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // 6. User Logs
        `CREATE TABLE IF NOT EXISTS user_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            log_type VARCHAR(50),
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // 7. Active Educations
        `CREATE TABLE IF NOT EXISTS active_educations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            target_level INT NOT NULL,
            start_time BIGINT NOT NULL,
            end_time BIGINT NOT NULL,
            UNIQUE KEY unique_user (user_id)
        )`,

        // 8. Licenses (Virtual table in code, but good to have if needed)
        `CREATE TABLE IF NOT EXISTS licenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            mine_type VARCHAR(50),
            level INT DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // 9. Player Mines
        `CREATE TABLE IF NOT EXISTS player_mines (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            mine_type VARCHAR(50) NOT NULL,
            name VARCHAR(100) DEFAULT 'Madenim',
            level INT DEFAULT 1,
            reserve INT DEFAULT 100,
            salary INT DEFAULT 100,
            vault DECIMAL(15, 2) DEFAULT 0,
            stock INT DEFAULT 0,
            workers INT DEFAULT 0,
            max_workers INT DEFAULT 5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // 10. Mine Logs
        `CREATE TABLE IF NOT EXISTS mine_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            mine_id INT NOT NULL,
            user_id INT NOT NULL,
            amount INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (mine_id) REFERENCES player_mines(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // 11. Mine Active Workers
        `CREATE TABLE IF NOT EXISTS mine_active_workers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            mine_id INT NOT NULL,
            user_id INT NOT NULL,
            end_time TIMESTAMP NOT NULL,
            FOREIGN KEY (mine_id) REFERENCES player_mines(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // 12. Mine Settings
        `CREATE TABLE IF NOT EXISTS mine_settings (
            mine_type VARCHAR(50) PRIMARY KEY,
            production_time INT DEFAULT 60
        )`,

        // 13. Arge Levels
        `CREATE TABLE IF NOT EXISTS arge_levels (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            mine_type VARCHAR(50) NOT NULL,
            level INT DEFAULT 0,
            reserve INT DEFAULT 0,
            last_collected DATETIME DEFAULT NULL,
            is_researching BOOLEAN DEFAULT FALSE,
            research_end_time BIGINT DEFAULT 0,
            is_reserve_researching BOOLEAN DEFAULT FALSE,
            reserve_research_end_time BIGINT DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // 14. Property Types
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

        // 15. Player Properties
        `CREATE TABLE IF NOT EXISTS player_properties (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            property_type_id INT NOT NULL,
            last_tax_collected TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (property_type_id) REFERENCES property_types(id)
        )`,

        // 16. Parties
        `CREATE TABLE IF NOT EXISTS parties (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            abbr VARCHAR(10) NOT NULL,
            leader_id INT NOT NULL,
            leader_name VARCHAR(100),
            ideology VARCHAR(50),
            color VARCHAR(20),
            members_count INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

        // 17. Chat Messages
        `CREATE TABLE IF NOT EXISTS chat_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            message TEXT NOT NULL,
            channel VARCHAR(50) DEFAULT 'global',
            is_deleted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // 18. Message Reports
        `CREATE TABLE IF NOT EXISTS message_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message_id INT NOT NULL,
            reporter_id INT NOT NULL,
            reason VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
            FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // 19. Daily Jobs
        `CREATE TABLE IF NOT EXISTS daily_jobs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            icon VARCHAR(50) DEFAULT 'fa-briefcase',
            time INT NOT NULL,
            minLevel INT DEFAULT 1,
            costH INT DEFAULT 0,
            costE INT DEFAULT 0,
            reward_money INT DEFAULT 0,
            reward_xp INT DEFAULT 0,
            reward_gold INT DEFAULT 0,
            reward_diamond INT DEFAULT 0
        )`,

        // 20. Active Daily Jobs
        `CREATE TABLE IF NOT EXISTS active_daily_jobs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            job_id INT NOT NULL,
            start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_time DATETIME NOT NULL,
            status VARCHAR(20) DEFAULT 'active',
            UNIQUE KEY unique_active_user (user_id)
        )`,

        // 21. Completed Daily Jobs
        `CREATE TABLE IF NOT EXISTS completed_daily_jobs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            job_id INT NOT NULL,
            completed_at DATE NOT NULL,
            UNIQUE KEY unique_daily_completion (user_id, job_id, completed_at)
        )`,

        // 22. Hospitals
        `CREATE TABLE IF NOT EXISTS hospitals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            level INT DEFAULT 1,
            capacity INT DEFAULT 5,
            quality INT DEFAULT 100,
            price INT DEFAULT 100,
            balance INT DEFAULT 0,
            total_treatments INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // 23. Hospital Treatments
        `CREATE TABLE IF NOT EXISTS hospital_treatments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            hospital_id INT NOT NULL,
            patient_name VARCHAR(255) NOT NULL,
            price INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
        )`,

        // 24. Hospital Active Treatments
        `CREATE TABLE IF NOT EXISTS hospital_active_treatments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            hospital_id INT NOT NULL,
            user_id INT NOT NULL,
            bed_index INT NOT NULL,
            start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_time DATETIME NOT NULL,
            UNIQUE KEY unique_bed (hospital_id, bed_index),
            UNIQUE KEY unique_user (user_id),
            FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // 25. Farm Types
        `CREATE TABLE IF NOT EXISTS farm_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            slug VARCHAR(50) NOT NULL UNIQUE,
            price INT NOT NULL,
            license_req INT NOT NULL,
            image_path VARCHAR(255),
            description TEXT
        )`,

        // 26. Player Farms
        `CREATE TABLE IF NOT EXISTS player_farms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            farm_type_id INT NOT NULL,
            level INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (farm_type_id) REFERENCES farm_types(id)
        )`,

        // 27. Ranch Types
        `CREATE TABLE IF NOT EXISTS ranch_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            slug VARCHAR(50) NOT NULL UNIQUE,
            price INT NOT NULL,
            gold_price INT DEFAULT 0,
            diamond_price INT DEFAULT 0,
            license_req INT NOT NULL,
            image_path VARCHAR(255),
            description TEXT
        )`,

        // 28. Player Ranches
        `CREATE TABLE IF NOT EXISTS player_ranches (
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
        )`,

        // 29. Ranch Active Workers
        `CREATE TABLE IF NOT EXISTS ranch_active_workers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ranch_id INT NOT NULL,
            user_id INT NOT NULL,
            start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            end_time TIMESTAMP NULL,
            amount INT DEFAULT 0,
            FOREIGN KEY (ranch_id) REFERENCES player_ranches(id) ON DELETE CASCADE
        )`,

        // 30. Ranch Logs
        `CREATE TABLE IF NOT EXISTS ranch_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ranch_id INT NOT NULL,
            user_id INT NOT NULL,
            message VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ranch_id) REFERENCES player_ranches(id) ON DELETE CASCADE
        )`,

        // 31. Banks
        `CREATE TABLE IF NOT EXISTS banks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            owner_id INT NOT NULL,
            name VARCHAR(255) DEFAULT 'Bank',
            balance DECIMAL(15, 2) DEFAULT 0,
            account_opening_fee INT DEFAULT 100,
            loan_rate DECIMAL(5, 2) DEFAULT 5.00,
            interest_rate DECIMAL(5, 2) DEFAULT 1.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // 32. Bank Accounts
        `CREATE TABLE IF NOT EXISTS bank_accounts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bank_id INT NOT NULL,
            user_id INT NOT NULL,
            iban VARCHAR(50) UNIQUE,
            balance DECIMAL(15, 2) DEFAULT 0,
            loan_debt DECIMAL(15, 2) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // 33. Bank Deposits
        `CREATE TABLE IF NOT EXISTS bank_deposits (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            bank_id INT NOT NULL,
            amount DECIMAL(15, 2) NOT NULL,
            status VARCHAR(20) DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`
    ];

    // Execute Table Creations
    let completed = 0;
    const runQueries = async () => {
        for (const query of queries) {
            await new Promise((resolve) => {
                db.query(query, (err) => {
                    if (err) console.error('Query failed:', err.message);
                    // else console.log('Table created/verified.');
                    resolve();
                });
            });
            completed++;
            console.log(`Processed ${completed}/${queries.length} tables.`);
        }
        
        console.log('All tables created. Inserting default data...');
        insertDefaults();
    };

    runQueries();

    function insertDefaults() {
        // Insert Mine Settings
        const mineSettings = [
            ['wood', 10], ['stone', 15], ['sand', 20], ['iron', 60],
            ['coal', 90], ['copper', 120], ['gold', 300], ['oil', 600], ['uranium', 1800]
        ];
        mineSettings.forEach(([type, time]) => {
            db.query('INSERT IGNORE INTO mine_settings (mine_type, production_time) VALUES (?, ?)', [type, time]);
        });

        // Insert Property Types
        const propTypes = [
            ['Gecekondu', 5000, 0, 0, '{"wood": 50, "stone": 20}', 500, 3600, 'icons/property-icon/shack.png'],
            ['Ahşap Ev', 15000, 0, 0, '{"wood": 150, "stone": 50, "glass": 10, "brick": 20}', 1200, 3600, 'icons/property-icon/wooden-house.png'],
            ['Betonarme Ev', 30000, 0, 0, '{"concrete": 50, "brick": 100, "glass": 20, "steel": 10}', 2500, 3600, 'icons/property-icon/concrete-house.png'],
            ['Apartman Dairesi', 75000, 10, 0, '{"concrete": 150, "steel": 20, "glass": 50, "brick": 50, "lumber": 20}', 5000, 3600, 'icons/property-icon/apartment.png'],
            ['Müstakil Villa', 150000, 50, 0, '{"concrete": 300, "steel": 50, "lumber": 100, "glass": 50, "brick": 100}', 12000, 3600, 'icons/property-icon/villa.png'],
            ['Lüks Rezidans', 300000, 150, 0, '{"concrete": 500, "steel": 150, "glass": 200, "lumber": 50, "brick": 200}', 25000, 3600, 'icons/property-icon/residence.png'],
            ['İş Merkezi', 750000, 500, 0, '{"concrete": 1000, "steel": 500, "glass": 500, "brick": 500}', 60000, 3600, 'icons/property-icon/business-center.png'],
            ['Gökdelen', 2000000, 1500, 0, '{"concrete": 2500, "steel": 1500, "glass": 1500, "lumber": 200}', 150000, 3600, 'icons/property-icon/skyscraper.png'],
            ['Saray', 5000000, 5000, 10, '{"concrete": 5000, "steel": 2000, "gold": 100, "glass": 500}', 400000, 3600, 'icons/property-icon/palace.png'],
            ['Uzay İstasyonu', 20000000, 20000, 100, '{"steel": 10000, "glass": 5000, "uranium": 500}', 2000000, 3600, 'icons/property-icon/space-station.png']
        ];
        propTypes.forEach(p => {
            db.query('INSERT IGNORE INTO property_types (name, cost_money, cost_gold, cost_diamond, req_materials, tax_income, tax_interval, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', p);
        });

        // Insert Farm Types
        const farmTypes = [
            ['Tavuk Çiftliği', 'chicken_farm', 5000, 1, 'icons/farm-icon/chicken.png', 'Yumurta üretimi için temel çiftlik.'],
            ['İnek Çiftliği', 'cow_farm', 15000, 2, 'icons/farm-icon/cow.png', 'Süt üretimi için gelişmiş çiftlik.'],
            ['Koyun Çiftliği', 'sheep_farm', 10000, 2, 'icons/farm-icon/sheep.png', 'Yün üretimi için çiftlik.'],
            ['Arı Çiftliği', 'bee_farm', 25000, 3, 'icons/farm-icon/bee.png', 'Bal üretimi için özel çiftlik.']
        ];
        farmTypes.forEach(f => {
            db.query('INSERT IGNORE INTO farm_types (name, slug, price, license_req, image_path, description) VALUES (?, ?, ?, ?, ?, ?)', f);
        });

        // Insert Ranch Types
        const ranchTypes = [
            ['Tavuk Kümesi', 'chicken', 10000, 0, 0, 1, 'icons/ranch-icon/chicken.png', 'Yumurta üretimi için.'],
            ['Koyun Ağılı', 'sheep', 15000, 0, 0, 2, 'icons/ranch-icon/sheep.png', 'Yün üretimi için.'],
            ['Arı Kovanı', 'bee', 12000, 0, 0, 3, 'icons/ranch-icon/bee.png', 'Bal üretimi için.'],
            ['İnek Çiftliği', 'cow', 25000, 5, 0, 5, 'icons/ranch-icon/cow.png', 'Süt üretimi için.']
        ];
        ranchTypes.forEach(r => {
            db.query('INSERT IGNORE INTO ranch_types (name, slug, price, gold_price, diamond_price, license_req, image_path, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', r);
        });

        // Insert Daily Jobs
        const jobs = [
            ['Broşür Dağıt', 'fa-newspaper', 30, 1, 5, 10, 100, 10, 0, 0],
            ['Kargo Taşıma', 'fa-box', 60, 2, 10, 20, 250, 25, 0, 0],
            ['Garsonluk', 'fa-utensils', 120, 3, 15, 30, 600, 50, 1, 0],
            ['Güvenlik', 'fa-shield-alt', 300, 5, 20, 50, 1500, 120, 2, 0],
            ['Yazılım İşi', 'fa-laptop-code', 600, 10, 10, 80, 5000, 300, 5, 1]
        ];
        jobs.forEach(j => {
            db.query('INSERT IGNORE INTO daily_jobs (name, icon, time, minLevel, costH, costE, reward_money, reward_xp, reward_gold, reward_diamond) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', j);
        });

        // Insert Dummy Parties
        db.query('SELECT COUNT(*) as count FROM parties', (err, res) => {
            if (!err && res[0].count === 0) {
                const dummyParties = [
                    ['Gelecek Vizyonu', 'GV', 1, 'Tamer', 'Liberal', '#3498db', 950],
                    ['Halkın Sesi', 'HS', 2, 'Demokrat', 'Sosyalist', '#e74c3c', 600],
                    ['Birlik Hareketi', 'BH', 3, 'Unity', 'Milliyetçi', '#f1c40f', 300],
                    ['Tekno Parti', 'TP', 4, 'Cyber', 'Teknokrat', '#9b59b6', 120]
                ];
                dummyParties.forEach(p => {
                    db.query('INSERT INTO parties (name, abbr, leader_id, leader_name, ideology, color, members_count) VALUES (?, ?, ?, ?, ?, ?, ?)', p);
                });
            }
        });

        console.log('Setup complete. Press Ctrl+C to exit if it doesn\'t close automatically.');
        setTimeout(() => {
            db.end();
            process.exit(0);
        }, 2000);
    }
});
