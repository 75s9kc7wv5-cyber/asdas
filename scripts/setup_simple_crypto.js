const mysql = require('mysql2');
const dbConfig = {
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
};

const connection = mysql.createConnection(dbConfig);

const updates = [
    "DROP TABLE IF EXISTS market_orders", // No longer needed
    "DROP TABLE IF EXISTS market_trades", // Re-creating with new schema directly
    `CREATE TABLE IF NOT EXISTS market_trades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('buy', 'sell') NOT NULL,
        price DECIMAL(16, 2) NOT NULL,
        amount DECIMAL(16, 8) NOT NULL,
        total_price DECIMAL(16, 2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS market_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        price DECIMAL(16, 2) NOT NULL,
        volume DECIMAL(16, 8) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
];

connection.connect(err => {
    if (err) throw err;
    console.log('DB Connected.');

    let p = Promise.resolve();
    updates.forEach(sql => {
        p = p.then(() => new Promise((resolve, reject) => {
            connection.query(sql, (err) => {
                if(err) console.error(err); // Log but continue
                else console.log('Executed:', sql.substring(0, 50) + '...');
                resolve();
            });
        }));
    });

    p.then(() => {
        // Ensure initial price
        connection.query('SELECT COUNT(*) as c FROM market_history', (err, res) => {
            if(res[0].c == 0) {
                connection.query('INSERT INTO market_history (price, volume) VALUES (10000.00, 0)', () => {
                    console.log('Init Data Created');
                    process.exit();
                });
            } else {
                process.exit();
            }
        });
    });
});
