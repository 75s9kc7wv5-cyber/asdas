const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'sim_world'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected!');
    db.query('SHOW TABLES', (err, results) => {
        if (err) throw err;
        console.log(results);
        process.exit();
    });
});