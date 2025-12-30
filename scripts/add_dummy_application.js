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

    // Find a party and a user who is NOT in that party (or just any user for testing)
    // For simplicity, I'll just pick a user and a party.
    
    const query = `
        INSERT INTO party_applications (party_id, user_id)
        SELECT p.id, u.id
        FROM parties p, users u
        WHERE p.id = (SELECT id FROM parties LIMIT 1)
        AND u.id != p.leader_id
        LIMIT 1
    `;

    db.query(query, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                console.log('Application already exists.');
            } else {
                console.error('Error inserting application:', err);
            }
        } else {
            console.log('Dummy application inserted.');
        }
        db.end();
    });
});
