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

    // Check and add all missing columns
    const columns = [
        { name: 'reserve', type: 'INT DEFAULT 0' },
        { name: 'last_collected', type: 'DATETIME DEFAULT NULL' }
    ];

    let addedCount = 0;
    let checkCount = 0;

    columns.forEach((col, index) => {
        db.query(`SHOW COLUMNS FROM arge_levels LIKE '${col.name}'`, (err, result) => {
            checkCount++;
            
            if (err) {
                console.error(`❌ Error checking column ${col.name}:`, err);
            } else if (result.length === 0) {
                // Column doesn't exist, add it
                db.query(`ALTER TABLE arge_levels ADD COLUMN ${col.name} ${col.type}`, (err) => {
                    if (err) {
                        console.error(`❌ Error adding column ${col.name}:`, err);
                    } else {
                        console.log(`✅ Added column: ${col.name} (${col.type})`);
                        addedCount++;
                    }
                    
                    if (checkCount === columns.length) {
                        if (addedCount === 0) {
                            console.log('✅ All columns already exist, no changes needed');
                        } else {
                            console.log(`✅ Added ${addedCount} column(s) to arge_levels table`);
                        }
                        db.end();
                        process.exit(0);
                    }
                });
            } else {
                console.log(`ℹ️  Column ${col.name} already exists`);
                
                if (checkCount === columns.length && addedCount === 0) {
                    console.log('✅ All columns already exist, no changes needed');
                    db.end();
                    process.exit(0);
                }
            }
        });
    });
});
