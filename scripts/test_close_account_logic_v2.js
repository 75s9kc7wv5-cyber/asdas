const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

const userId = 4;
const bankId = 2;

db.connect(err => {
    if (err) {
        console.error('DB Connect Error:', err);
        process.exit(1);
    }
    console.log('Connected to DB');

    db.beginTransaction(err => {
        if (err) { console.error('Transaction Error', err); return; }
        console.log('Transaction Started');

        // 1. Get Info (Corrected query)
        const infoQuery = `
            SELECT ba.id, ba.loan_debt, ba.balance, u.money as user_money, u.username
            FROM bank_accounts ba
            JOIN users u ON ba.user_id = u.id
            WHERE ba.user_id = ? AND ba.bank_id = ?
        `;
        
        db.query(infoQuery, [userId, bankId], (err, results) => {
            if (err) { console.error('Info Query Error:', err); db.rollback(); return; }
            if (results.length === 0) { console.log('Account not found'); db.rollback(); return; }

            const { id: accountId, loan_debt, balance, user_money, username } = results[0];
            const fee = 5000;
            console.log('Account Found:', { accountId, fee, loan_debt, balance });

            // 2. Check Debt
            if (loan_debt > 0) {
                console.log('Debt exists, simulating penalty...');
                // ... (Logic skipped for this test unless debt exists)
            }

            // 2.1 Check Active Deposits
            const depositQuery = 'SELECT COUNT(*) as count FROM bank_deposits WHERE user_id = ? AND bank_id = ? AND status = "active"';
            db.query(depositQuery, [userId, bankId], (err, depResults) => {
                if (err) { console.error('Deposit Query Error:', err); db.rollback(); return; }
                
                if (depResults[0].count > 0) {
                    console.log('Active deposits exist');
                    db.rollback();
                    return;
                }

                 // 3. Update User Money
                const netChange = balance - fee;
                console.log(`Updating user money by ${netChange}`);
                
                db.query('UPDATE users SET money = money + ? WHERE id = ?', [netChange, userId], (err) => {
                    if (err) { console.error('User Update Error:', err); db.rollback(); return; }

                    // 6. Update Bank Balance
                    db.query('UPDATE banks SET balance = balance + ? WHERE id = ?', [fee, bankId], (err) => {
                        if (err) { console.error('Bank Update Error:', err); db.rollback(); return; }

                        // 7. Delete Account
                        db.query('DELETE FROM bank_accounts WHERE user_id = ? AND bank_id = ?', [userId, bankId], (err) => {
                            if (err) { console.error('Delete Account Error:', err); db.rollback(); return; }

                            // 8. Log Transaction
                            const logDesc = `Hesap Kapatma (Ücret: ${fee} TL) 🏦❌`;
                            const logQuery = 'INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)';
                            
                            console.log('Inserting into bank_transactions...');
                            db.query(logQuery, [userId, bankId, accountId, 'account_closure', fee, logDesc], (err) => {
                                if (err) { console.error('Log Insert Error:', err); }
                                else { console.log('Log Insert Success!'); }

                                db.rollback(() => {
                                    console.log('Rolled back test transaction.');
                                    process.exit(0);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
