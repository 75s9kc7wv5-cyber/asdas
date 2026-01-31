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

    const addColumn = `ALTER TABLE daily_jobs ADD COLUMN color VARCHAR(20) DEFAULT '#00e5ff'`;
    
    db.query(addColumn, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Add column error:', err);
        } else {
            console.log('Added color column (or already exists).');
        }

        const updates = [
            { id: 1, color: '#3498db' }, // Newspaper - Blue
            { id: 2, color: '#e67e22' }, // Box - Orange
            { id: 3, color: '#e74c3c' }, // Utensils - Red
            { id: 4, color: '#2ecc71' }, // Shield - Green (Security usually green/blue)
            { id: 5, color: '#9b59b6' }  // Laptop - Purple
        ];

        let completed = 0;
        updates.forEach(u => {
            db.query('UPDATE daily_jobs SET color = ? WHERE id = ?', [u.color, u.id], (err) => {
                if(err) console.error(err);
                completed++;
                if(completed === updates.length) {
                    console.log('Updated job colors.');
                    process.exit(0);
                }
            });
        });
    });
});
