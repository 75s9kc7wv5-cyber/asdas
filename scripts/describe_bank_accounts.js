const mysql = require('mysql2');
const db = mysql.createConnection({host:'localhost',user:'simuser',password:'password',database:'simworld'});
db.connect(err => {
    db.query('DESCRIBE bank_accounts', (err, res) => {
        console.log(res);
        process.exit();
    });
});