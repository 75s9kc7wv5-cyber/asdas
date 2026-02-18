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

    // 1. Create party_logs table
    const createPartyLogs = `
        CREATE TABLE IF NOT EXISTS party_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            party_id INT NOT NULL,
            user_id INT NOT NULL,
            action_type VARCHAR(50) NOT NULL,
            amount INT DEFAULT 0,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(createPartyLogs, (err) => {
        if (err) console.error('Error creating party_logs:', err);
        else console.log('party_logs table ready.');

        // 2. Create party_applications table
        const createPartyApps = `
            CREATE TABLE IF NOT EXISTS party_applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                party_id INT NOT NULL,
                user_id INT NOT NULL,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        db.query(createPartyApps, (err) => {
            if (err) console.error('Error creating party_applications:', err);
            else console.log('party_applications table ready.');

            // 3. Add columns to parties table
            const addVault = "ALTER TABLE parties ADD COLUMN vault INT DEFAULT 0";
            const addAnnouncement = "ALTER TABLE parties ADD COLUMN announcement TEXT";

            db.query(addVault, (err) => {
                if (err && err.code !== 'ER_DUP_FIELDNAME') console.error('Error adding vault:', err);
                else console.log('vault column ready.');

                db.query(addAnnouncement, (err) => {
                    if (err && err.code !== 'ER_DUP_FIELDNAME') console.error('Error adding announcement:', err);
                    else console.log('announcement column ready.');

                    db.end();
                });
            });
        });
    });
});
