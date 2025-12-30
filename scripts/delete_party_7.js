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

    const partyId = 7;

    // 1. Remove members from the party
    db.query('UPDATE users SET party_id = NULL, party_role = NULL WHERE party_id = ?', [partyId], (err, res) => {
        if (err) console.error('Error updating users:', err);
        else console.log(`Removed ${res.changedRows} members from party ${partyId}.`);

        // 2. Delete applications for this party
        db.query('DELETE FROM party_applications WHERE party_id = ?', [partyId], (err, res) => {
            if (err) console.error('Error deleting applications:', err); // Might fail if table doesn't exist, but that's okay
            else console.log(`Deleted ${res.affectedRows} applications for party ${partyId}.`);

            // 3. Delete logs for this party (if any table exists, assuming party_logs based on file list)
            // If table doesn't exist, this query will fail, we can ignore or handle it.
            // Let's try to be safe and just delete the party, assuming FKs might handle logs or we don't care about orphaned logs for now.
            // But let's try to delete from parties first.
            
            db.query('DELETE FROM parties WHERE id = ?', [partyId], (err, res) => {
                if (err) console.error('Error deleting party:', err);
                else console.log(`Deleted party ${partyId}. Affected rows: ${res.affectedRows}`);
                
                db.end();
            });
        });
    });
});
