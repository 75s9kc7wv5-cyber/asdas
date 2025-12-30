const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected!');
    
    db.query('DESCRIBE licenses', (err, res) => {
        if(err) console.error('Describe licenses failed:', err);
        else console.log('Licenses Table:', res);
        db.end();
    });
});
