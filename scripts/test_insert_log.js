const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('DB connect fail:', err);
        process.exit(1);
    }
    console.log('Connected');
    
    // Simulate the failing insert
    const userId = 4;
    const bankId = 2;
    const accountId = 99999; // Non-existent account ID
    const fee = 5000;
    const logDesc = `Test Log`;
    
    const logQuery = 'INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)';
    
    db.query(logQuery, [userId, bankId, accountId, 'test_closure', fee, logDesc], (err, res) => {
        if (err) {
            console.error('INSERT FAILED:', err);
        } else {
            console.log('INSERT SUCCESS:', res);
        }
        process.exit();
    });
});
