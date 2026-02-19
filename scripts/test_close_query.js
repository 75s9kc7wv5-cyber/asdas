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
    
    const userId = 4;
    const bankId = 2;
    
    const infoQuery = `
        SELECT ba.id, ba.loan_debt, ba.balance, u.money as user_money, u.username
        FROM bank_accounts ba
        JOIN users u ON ba.user_id = u.id
        WHERE ba.user_id = ? AND ba.bank_id = ?
    `;
    
    db.query(infoQuery, [userId, bankId], (err, results) => {
        if (err) {
            console.error('QUERY FAILED:', err);
            console.error('Message:', err.message);
        } else {
            console.log('QUERY SUCCESS:', results);
        }
        process.exit();
    });
});
