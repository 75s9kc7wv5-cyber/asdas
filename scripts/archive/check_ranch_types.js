const mysql = require('mysql2');
const db = mysql.createConnection({
    host: 'localhost', user: 'simuser', password: 'password', database: 'simworld'
});
db.connect();
db.query('SELECT * FROM ranch_types', (err, res) => {
    if(err) console.error(err);
    else console.log(res);
    db.end();
});
