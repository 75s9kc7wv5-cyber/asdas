const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
    
    db.query("SHOW COLUMNS FROM hospitals", (err, result) => {
        if (err) throw err;
        console.log(result);
        process.exit();
    });
});
