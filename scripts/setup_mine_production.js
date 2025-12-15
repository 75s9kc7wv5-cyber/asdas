const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to DB');

    const createSettingsTable = `
        CREATE TABLE IF NOT EXISTS mine_settings (
            mine_type VARCHAR(50) PRIMARY KEY,
            production_time INT DEFAULT 60
        )
    `;

    db.query(createSettingsTable, (err) => {
        if (err) throw err;
        console.log('mine_settings table created/checked');

        const defaults = [
            ['wood', 10],
            ['stone', 15],
            ['sand', 20],
            ['iron', 60],
            ['coal', 90],
            ['copper', 120],
            ['gold', 300],
            ['oil', 600],
            ['uranium', 1800]
        ];

        let completed = 0;
        defaults.forEach(([type, time]) => {
            db.query('INSERT IGNORE INTO mine_settings (mine_type, production_time) VALUES (?, ?)', [type, time], (err) => {
                if (err) console.error(err);
                completed++;
                if (completed === defaults.length) {
                    console.log('Defaults inserted');
                    addColumn();
                }
            });
        });
    });

    function addColumn() {
        const alterQuery = "ALTER TABLE arge_levels ADD COLUMN last_collected DATETIME DEFAULT NULL";
        db.query(alterQuery, (err) => {
            if (err && err.code !== 'ER_DUP_FIELDNAME') {
                console.error('Error adding column:', err);
            } else {
                console.log('last_collected column added to arge_levels');
            }
            process.exit();
        });
    }
});
