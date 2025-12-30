const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const userId = 1;
    const partyId = 7;

    // 1. Demote any existing leader in Party 7
    db.query('UPDATE users SET party_role = "Üye" WHERE party_id = ? AND party_role = "Genel Başkan"', [partyId], (err, res) => {
        if (err) console.error(err);
        console.log(`Demoted ${res.changedRows} existing leaders in party ${partyId}.`);

        // 2. Update User 1 to be in Party 7 and be Genel Başkan
        db.query('UPDATE users SET party_id = ?, party_role = "Genel Başkan" WHERE id = ?', [partyId, userId], (err, res) => {
            if (err) console.error(err);
            console.log(`Updated User ${userId}: Party ${partyId}, Role 'Genel Başkan'.`);

            // 3. Update Party 7 to have User 1 as leader
            db.query('UPDATE parties SET leader_id = ? WHERE id = ?', [userId, partyId], (err, res) => {
                if (err) console.error(err);
                console.log(`Updated Party ${partyId}: Leader is now User ${userId}.`);
                
                db.end();
            });
        });
    });
});
