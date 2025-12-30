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
    
    db.query('SELECT * FROM licenses', (err, licenses) => {
        if (err) console.error(err);
        else console.log('Licenses Data:', licenses);
        
        db.query('SELECT * FROM farm_types', (err, farmTypes) => {
            if (err) console.error(err);
            else console.log('Farm Types Data:', farmTypes);
            
            process.exit();
        });
    });
});