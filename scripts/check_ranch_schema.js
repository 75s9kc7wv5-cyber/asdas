const mysql = require('mysql2');
// require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',     
    password: 'password', 
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('Connection failed: ' + err.stack);
        return;
    }

    console.log('Connected to database.');

    db.query('DESCRIBE ranch_types', (err, result) => {
        if (err) console.log('ranch_types error or not found');
        else {
             console.log('--- ranch_types ---');
             console.log(result.map(r => r.Field).join(', '));
        }

        db.query('DESCRIBE player_ranches', (err, result) => {
            if (err) console.log('player_ranches error or not found');
            else {
                 console.log('--- player_ranches ---');
                 console.log(result.map(r => r.Field).join(', '));
            }
            db.end();
            process.exit();
        });
    });
});
