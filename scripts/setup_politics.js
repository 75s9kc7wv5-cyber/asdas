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
    console.log('Connected!');

    const createPartiesTable = `
        CREATE TABLE IF NOT EXISTS parties (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            abbr VARCHAR(10) NOT NULL,
            leader_id INT NOT NULL,
            leader_name VARCHAR(100),
            ideology VARCHAR(50),
            color VARCHAR(20),
            members_count INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(createPartiesTable, (err) => {
        if (err) {
            console.error('Failed to create parties table:', err);
            process.exit(1);
        }
        console.log('Parties table created/verified.');

        const addPartyIdColumn = `
            ALTER TABLE users ADD COLUMN party_id INT DEFAULT NULL
        `;

        // Check if column exists first (we know it doesn't, but good practice or just try/catch)
        // Since I just checked, I will try to add it. If it fails because it exists, it's fine.
        db.query(addPartyIdColumn, (err) => {
            if (err && err.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add party_id to users:', err);
            } else {
                console.log('party_id column added to users (or already exists).');
            }

            // Insert dummy parties if empty
            db.query('SELECT COUNT(*) as count FROM parties', (err, res) => {
                if (res[0].count === 0) {
                    const dummyParties = [
                        ['Gelecek Vizyonu', 'GV', 1, 'Tamer', 'Liberal', '#3498db', 950],
                        ['Halkın Sesi', 'HS', 2, 'Demokrat', 'Sosyalist', '#e74c3c', 600],
                        ['Birlik Hareketi', 'BH', 3, 'Unity', 'Milliyetçi', '#f1c40f', 300],
                        ['Tekno Parti', 'TP', 4, 'Cyber', 'Teknokrat', '#9b59b6', 120]
                    ];
                    const insertQuery = 'INSERT INTO parties (name, abbr, leader_id, leader_name, ideology, color, members_count) VALUES ?';
                    db.query(insertQuery, [dummyParties], (err) => {
                        if (err) console.error('Failed to insert dummy parties:', err);
                        else console.log('Dummy parties inserted.');
                        db.end();
                    });
                } else {
                    console.log('Parties table already has data.');
                    db.end();
                }
            });
        });
    });
});
