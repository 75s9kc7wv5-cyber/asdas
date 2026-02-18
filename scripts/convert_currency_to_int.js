
const mysql = require('mysql2');
const dbConfig = {
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
};

const db = mysql.createConnection(dbConfig);

const updates = [
    "ALTER TABLE users MODIFY COLUMN money BIGINT DEFAULT 1000",
    "ALTER TABLE bank_accounts MODIFY COLUMN balance BIGINT DEFAULT 0",
    "ALTER TABLE bank_accounts MODIFY COLUMN loan_debt BIGINT DEFAULT 0",
    "ALTER TABLE banks MODIFY COLUMN balance BIGINT DEFAULT 0",
    "ALTER TABLE market_trades MODIFY COLUMN price BIGINT",
    "ALTER TABLE market_trades MODIFY COLUMN total_price BIGINT"
];

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');
    
    runUpdates(0);
});

function runUpdates(index) {
    if (index >= updates.length) {
        console.log('All updates completed.');
        db.end();
        process.exit(0);
    }

    const query = updates[index];
    console.log(`Running: ${query}`);
    
    db.query(query, (err, result) => {
        if (err) {
            console.error(`Error executing query: ${query}`, err);
            // We continue even if error, maybe column doesn't exist or already modified
        } else {
            console.log('Success.');
        }
        runUpdates(index + 1);
    });
}
