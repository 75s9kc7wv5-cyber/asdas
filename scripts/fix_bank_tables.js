const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld',
    multipleStatements: true
});

db.connect(err => {
    if (err) {
        console.error('DB Connect Error:', err);
        process.exit(1);
    }
    console.log('Connected to DB');

    // 1. Add credit_score to bank_accounts
    const addColumnSql = "ALTER TABLE bank_accounts ADD COLUMN IF NOT EXISTS credit_score INT DEFAULT 0";
    
    db.query(addColumnSql, (err, result) => {
        if (err) {
            // Fallback for older MySQL
            if (err.code === 'ER_PARSE_ERROR' || err.code === 'ER_SYNTAX_ERROR') {
                console.log('Retrying add column credit_score without IF NOT EXISTS...');
                db.query("ALTER TABLE bank_accounts ADD COLUMN credit_score INT DEFAULT 0", (e2) => {
                    if (e2 && e2.code !== 'ER_DUP_FIELDNAME') console.error('Failed to add credit_score:', e2);
                    else console.log('credit_score column added/exists in bank_accounts');
                    createTransactionsTable();
                });
            } else {
                console.error('Error adding credit_score:', err);
                createTransactionsTable();
            }
        } else {
            console.log('credit_score column added/exists in bank_accounts');
            createTransactionsTable();
        }
    });

    function createTransactionsTable() {
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS bank_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bank_id INT NOT NULL,
                user_id INT NOT NULL,
                transaction_type VARCHAR(50),
                amount BIGINT DEFAULT 0,
                description VARCHAR(255),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (bank_id),
                INDEX (user_id)
            )
        `;

        db.query(createTableSql, (err, result) => {
            if (err) {
                console.error('Error creating bank_transactions table:', err);
            } else {
                console.log('bank_transactions table created/exists');
            }
            process.exit();
        });
    }
});
