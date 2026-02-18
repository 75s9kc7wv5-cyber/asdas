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

    // Check if columns exist first
    db.query("SHOW COLUMNS FROM arge_levels LIKE 'is_reserve_researching'", (err, result) => {
        if (err) {
            console.error('❌ Error checking columns:', err);
            db.end();
            process.exit(1);
        }

        if (result.length > 0) {
            console.log('✅ Columns already exist, no action needed');
            db.end();
            process.exit(0);
            return;
        }

        // Add columns if they don't exist
        const alterQuery = `
            ALTER TABLE arge_levels
            ADD COLUMN is_reserve_researching BOOLEAN DEFAULT FALSE,
            ADD COLUMN reserve_research_end_time BIGINT DEFAULT 0
        `;

        db.query(alterQuery, (err) => {
            if (err) {
                console.error('❌ Error adding columns:', err);
                db.end();
                process.exit(1);
            }
            
            console.log('✅ Reserve research columns added to arge_levels table');
            console.log('   - is_reserve_researching (BOOLEAN)');
            console.log('   - reserve_research_end_time (BIGINT)');
            
            db.end();
            process.exit(0);
        });
    });
});
