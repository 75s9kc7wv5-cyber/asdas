const mysql = require('mysql2');
const db = mysql.createConnection({
    host: 'localhost', 
    user: 'simuser', 
    password: 'password', 
    database: 'simworld'
});

db.connect();
db.query('SELECT * FROM player_mines', (err, results) => {
    console.log(results);
    db.end();
});
