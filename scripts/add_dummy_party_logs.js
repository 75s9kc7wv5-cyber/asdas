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

    // Get all parties
    db.query('SELECT id, leader_id FROM parties', (err, parties) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        if (parties.length === 0) {
            console.log('No parties found.');
            db.end();
            return;
        }

        const logs = [];
        parties.forEach(party => {
            // Add some deposit logs for the leader
            logs.push([party.id, party.leader_id, 'deposit', 50000, 'Bağış: 50000 ₺']);
            logs.push([party.id, party.leader_id, 'deposit', 25000, 'Bağış: 25000 ₺']);
            
            // Add some other logs
            logs.push([party.id, party.leader_id, 'settings_update', 0, 'Parti ayarları güncellendi.']);
        });

        const query = 'INSERT INTO party_logs (party_id, user_id, action_type, amount, message) VALUES ?';
        db.query(query, [logs], (err) => {
            if (err) console.error('Error inserting logs:', err);
            else console.log(`Inserted ${logs.length} dummy logs.`);
            db.end();
        });
    });
});
