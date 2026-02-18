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
        return;
    }
    console.log('Connected to DB');

    const checkTable = (tableName) => {
        db.query(`SHOW COLUMNS FROM ${tableName}`, (err, results) => {
            if (err) {
                console.error(`Error checking ${tableName}:`, err);
            } else {
                console.log(`Columns in ${tableName}:`);
                results.forEach(col => {
                    console.log(` - ${col.Field} (${col.Type})`);
                });
            }
        });
    };

    checkTable('mine_active_workers');
    checkTable('mine_logs');

    setTimeout(() => {
        db.end();
    }, 2000);
});
