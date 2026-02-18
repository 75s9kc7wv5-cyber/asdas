const mysql = require('mysql2');
const dbConfig = {
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
};

const connection = mysql.createConnection(dbConfig);

const createTables = [
    `CREATE TABLE IF NOT EXISTS market_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('buy', 'sell') NOT NULL,
        price DECIMAL(16, 8) NOT NULL,
        initial_amount DECIMAL(16, 8) NOT NULL,
        remaining_amount DECIMAL(16, 8) NOT NULL,
        status ENUM('open', 'filled', 'cancelled', 'partial') DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status_price (status, price),
        INDEX idx_user (user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS market_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        price DECIMAL(16, 8) NOT NULL,
        volume DECIMAL(16, 8) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS market_trades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buyer_order_id INT,
        seller_order_id INT,
        price DECIMAL(16, 8) NOT NULL,
        amount DECIMAL(16, 8) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
];

connection.connect(err => {
    if (err) throw err;
    console.log('Connected to DB.');

    let p = Promise.resolve();
    createTables.forEach(sql => {
        p = p.then(() => new Promise((resolve, reject) => {
            connection.query(sql, (err, res) => {
                if (err) return reject(err);
                console.log('Table created or exists.');
                resolve();
            });
        }));
    });

    // Initial Market Data (Mock)
    p.then(() => {
        // Check if history empty
        connection.query('SELECT COUNT(*) as c FROM market_history', (err, res) => {
            if (res[0].c == 0) {
                // Initial Price = Cost (e.g., 10000 USD) + Volatility
                connection.query('INSERT INTO market_history (price, volume) VALUES (10000.00, 0)', () => {
                   console.log('Initial price set.');
                   process.exit();
                });
            } else {
                process.exit();
            }
        });
    });
});
