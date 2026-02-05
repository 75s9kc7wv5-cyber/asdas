const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) { console.error(err); process.exit(1); }
    
    db.query('SHOW TABLES LIKE "mine_logs"', (err, results) => {
        if (err) console.error(err);
        if (results.length > 0) {
            console.log('mine_logs table exists');
            db.query('DESCRIBE mine_logs', (err, cols) => {
                if(err) console.error(err);
                else console.log(cols);
                db.end();
            });
        } else {
            console.log('mine_logs table does NOT exist');
            db.end();
        }
    });
});
