const mysql = require('mysql2');
const db = mysql.createConnection({ host: 'localhost', user: 'simuser', password: 'password', database: 'simworld' });
db.connect(() => {
    db.query('SELECT id, name, cost_money FROM property_types ORDER BY cost_money ASC', (err, res) => {
        if(err) console.error(err);
        else console.log(JSON.stringify(res, null, 2));
        process.exit();
    });
});
