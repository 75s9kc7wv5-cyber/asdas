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
    console.log('Connected.');

    // Add reqEducation column if not exists
    const addColumn = `ALTER TABLE daily_jobs ADD COLUMN reqEducation INT DEFAULT 0`;
    
    db.query(addColumn, (err) => {
        if (err) {
            // If error is duplicate column, that's fine
            if (err.code !== 'ER_DUP_FIELDNAME') {
                console.error('Add column error:', err);
            } else {
                console.log('Column reqEducation already exists.');
            }
        } else {
            console.log('Added reqEducation column.');
        }

        // Update existing jobs with some education values
        const updates = [
            { id: 1, val: 0 },
            { id: 2, val: 10 },
            { id: 3, val: 20 },
            { id: 4, val: 40 },
            { id: 5, val: 60 }
        ];

        let completed = 0;
        updates.forEach(u => {
            db.query('UPDATE daily_jobs SET reqEducation = ? WHERE id = ?', [u.val, u.id], (err) => {
                if(err) console.error(err);
                completed++;
                if(completed === updates.length) {
                    console.log('Updated education requirements.');
                    process.exit(0);
                }
            });
        });
    });
});
