const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected!');

    const checkTable = (tableName) => {
        db.query(`DESCRIBE ${tableName}`, (err, res) => {
            if (err) console.error(`Error describing ${tableName}:`, err.message);
            else {
                console.log(`\nTable: ${tableName}`);
                console.table(res);
            }
        });
    };

    checkTable('users');

    setTimeout(() => {
        db.end();
    }, 2000);
});
