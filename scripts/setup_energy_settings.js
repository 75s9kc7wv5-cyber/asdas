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
        return;
    }
    console.log('Connected to database.');

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS mine_settings (
            mine_type VARCHAR(50) PRIMARY KEY,
            production_time INT DEFAULT 60
        )
    `;

    db.query(createTableQuery, (err) => {
        if (err) {
            console.error('Error creating table:', err);
            db.end();
            return;
        }
        console.log('Table mine_settings checked/created.');

        const settings = [
            { type: 'coal_plant', time: 60 },
            { type: 'nuclear_plant', time: 60 }
        ];

        let completed = 0;
        settings.forEach(s => {
            const query = 'INSERT IGNORE INTO mine_settings (mine_type, production_time) VALUES (?, ?)';
            db.query(query, [s.type, s.time], (err) => {
                if (err) console.error(`Error inserting ${s.type}:`, err);
                else console.log(`Inserted/Checked ${s.type}`);
                
                completed++;
                if (completed === settings.length) {
                    console.log('Done.');
                    db.end();
                }
            });
        });
    });
});
