const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(async (err) => {
    if (err) { console.error(err); process.exit(1); }
    console.log('Connected to DB');

    // 1. Add BTC to users if not exists
    try {
        await new Promise((resolve, reject) => {
            db.query("SHOW COLUMNS FROM users LIKE 'btc'", (err, res) => {
                if (err) reject(err);
                if (res.length === 0) {
                    db.query("ALTER TABLE users ADD COLUMN btc DECIMAL(16, 8) DEFAULT 0.00000000", (err) => {
                        if (err) reject(err);
                        console.log("Added btc column to users");
                        resolve();
                    });
                } else {
                    console.log("btc column already exists");
                    resolve();
                }
            });
        });

        // 2. Create player_rigs table
        const createRigTable = `
            CREATE TABLE IF NOT EXISTS player_rigs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                slot_index INT NOT NULL,
                gpu_key VARCHAR(50) NOT NULL,
                installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT 1,
                last_collection TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                KEY idx_user_slot (user_id, slot_index)
            )
        `;
        
        await new Promise((resolve, reject) => {
            db.query(createRigTable, (err) => {
                if(err) reject(err);
                console.log("player_rigs table checked/created");
                resolve();
            });
        });

    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        db.end();
        process.exit();
    }
});
