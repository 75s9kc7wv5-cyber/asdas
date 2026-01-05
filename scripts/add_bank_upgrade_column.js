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

    // Add upgrade_end_time column to banks table
    const alterQuery = `
        ALTER TABLE banks 
        ADD COLUMN IF NOT EXISTS upgrade_end_time DATETIME NULL DEFAULT NULL
    `;

    db.query(alterQuery, (err) => {
        if (err) {
            // MySQL doesn't support IF NOT EXISTS in ALTER TABLE ADD COLUMN
            // Try adding without IF NOT EXISTS
            const simpleAlterQuery = `ALTER TABLE banks ADD COLUMN upgrade_end_time DATETIME NULL DEFAULT NULL`;
            db.query(simpleAlterQuery, (err2) => {
                if (err2) {
                    if (err2.code === 'ER_DUP_FIELDNAME') {
                        console.log('✅ upgrade_end_time column already exists');
                    } else {
                        console.error('❌ Error adding column:', err2);
                        db.end();
                        process.exit(1);
                    }
                } else {
                    console.log('✅ upgrade_end_time column added to banks table');
                }
                db.end();
                console.log('\n✅ Script completed');
            });
        } else {
            console.log('✅ upgrade_end_time column added to banks table');
            db.end();
            console.log('\n✅ Script completed');
        }
    });
});
