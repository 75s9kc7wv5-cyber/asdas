const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('CONNECTION FAILED:', err.message);
        process.exit(1);
    } else {
        console.log('CONNECTION SUCCESSFUL');
        db.end();
        process.exit(0);
    }
});
