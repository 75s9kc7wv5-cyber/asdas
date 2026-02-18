
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

    // Add keys to all users (or just one for safety, but for dev env all is fine)
    // Keys: key_common, key_rare, key_epic
    
    // Using INSERT IGNORE or ON DUPLICATE KEY UPDATE
    const keys = ['key_common', 'key_rare', 'key_epic'];
    const amount = 10;

    let successCount = 0;

    // Get all user IDs
    db.query('SELECT id FROM users', (err, users) => {
        if (err) throw err;

        if (users.length === 0) {
            console.log('No users found.');
            process.exit();
        }

        const totalOps = users.length * keys.length;
        let doneOps = 0;

        users.forEach(user => {
            keys.forEach(key => {
                const sql = `
                    INSERT INTO inventory (user_id, item_key, quantity) 
                    VALUES (?, ?, ?) 
                    ON DUPLICATE KEY UPDATE quantity = quantity + ?
                `;
                db.query(sql, [user.id, key, amount, amount], (err) => {
                    if (err) console.error(err);
                    doneOps++;
                    if (doneOps >= totalOps) {
                        console.log('Keys added successfully.');
                        process.exit();
                    }
                });
            });
        });
    });
});
