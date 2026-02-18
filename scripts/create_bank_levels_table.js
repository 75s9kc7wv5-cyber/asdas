const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('❌ DB Connection Error:', err);
        process.exit(1);
    }
    console.log('✅ Connected to MySQL');

    // Create bank_levels table
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS bank_levels (
            id INT AUTO_INCREMENT PRIMARY KEY,
            level INT NOT NULL UNIQUE,
            capacity INT NOT NULL,
            upgrade_cost_money INT DEFAULT 0,
            upgrade_cost_gold INT DEFAULT 0,
            upgrade_cost_diamond INT DEFAULT 0,
            upgrade_duration_minutes INT DEFAULT 10,
            req_lumber INT DEFAULT 0,
            req_brick INT DEFAULT 0,
            req_glass INT DEFAULT 0,
            req_concrete INT DEFAULT 0,
            req_steel INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(createTableQuery, (err) => {
        if (err) {
            console.error('❌ Error creating table:', err);
            db.end();
            process.exit(1);
        }
        console.log('✅ bank_levels table created or already exists');

        // Insert default levels (1-10)
        const levels = [];
        for (let i = 1; i <= 10; i++) {
            const capacity = 10 * i; // 10, 20, 30, ..., 100
            const baseCost = 50000 * i; // Para maliyeti
            const goldCost = 100 * i; // Altın maliyeti
            const diamondCost = i > 5 ? (i - 5) * 10 : 0; // 6+ seviyeden itibaren elmas
            const duration = 5 * i; // Dakika
            
            // Malzeme gereksinimleri
            const lumber = i * 50;
            const brick = i * 40;
            const glass = i > 3 ? (i - 3) * 30 : 0;
            const concrete = i > 5 ? (i - 5) * 25 : 0;
            const steel = i > 7 ? (i - 7) * 20 : 0;

            levels.push([
                i,
                capacity,
                baseCost,
                goldCost,
                diamondCost,
                duration,
                lumber,
                brick,
                glass,
                concrete,
                steel
            ]);
        }

        const insertQuery = `
            INSERT IGNORE INTO bank_levels 
            (level, capacity, upgrade_cost_money, upgrade_cost_gold, upgrade_cost_diamond, 
             upgrade_duration_minutes, req_lumber, req_brick, req_glass, req_concrete, req_steel) 
            VALUES ?
        `;

        db.query(insertQuery, [levels], (err, result) => {
            if (err) {
                console.error('❌ Error inserting levels:', err);
                db.end();
                process.exit(1);
            }
            console.log(`✅ Inserted ${result.affectedRows} bank levels`);
            
            // Display inserted levels
            db.query('SELECT * FROM bank_levels ORDER BY level', (err, rows) => {
                if (err) {
                    console.error('❌ Error fetching levels:', err);
                } else {
                    console.log('\n📊 Bank Levels:');
                    rows.forEach(row => {
                        console.log(`   Lv${row.level}: ${row.capacity} müşteri | ${row.upgrade_cost_money}₺ ${row.upgrade_cost_gold}Au ${row.upgrade_cost_diamond}💎 | ${row.upgrade_duration_minutes}dk`);
                    });
                }
                db.end();
                console.log('\n✅ Script completed');
            });
        });
    });
});
