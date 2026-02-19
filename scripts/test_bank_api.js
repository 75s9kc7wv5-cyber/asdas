const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

const userId = 4; // Assuming this is the user trying to open the page
const bankId = 2; // Assuming bank id

db.connect(err => {
    if (err) { console.error('DB Connect Error:', err); process.exit(1); }

    const query = `
        SELECT ba.*, b.name as bank_name, b.interest_rate, b.loan_rate, b.transfer_fee, b.level,
        u.username as owner_name,
        customer.education_skill
        FROM bank_accounts ba
        JOIN banks b ON ba.bank_id = b.id
        LEFT JOIN users u ON b.owner_id = u.id
        JOIN users customer ON ba.user_id = customer.id
        WHERE ba.user_id = ? AND ba.bank_id = ?
    `;

    db.query(query, [userId, bankId], (err, results) => {
        if (err) { console.error('Query Error:', err); }
        else {
            console.log('Results length:', results.length);
            if (results.length > 0) {
                console.log('Raw result:', results[0]);
                console.log('Types:', typeof results[0].education_skill);
            }
        }
        db.end();
    });
});