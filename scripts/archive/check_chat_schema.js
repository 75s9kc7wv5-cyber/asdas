const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('Connect error:', err);
        return;
    }
    console.log('Connected');
    
    db.query('DESCRIBE chat_messages', (err, results) => {
        if (err) console.error(err);
        else console.log(results);
        db.end();
    });
});
