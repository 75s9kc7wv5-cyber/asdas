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
    
    db.query('DESCRIBE player_ranches', (err, res) => {
        if(err) console.error('Describe player_ranches failed:', err);
        else console.log('Player Ranches Table:', res);
        
        db.query('DESCRIBE ranch_types', (err, res) => {
            if(err) console.error('Describe ranch_types failed:', err);
            else console.log('Ranch Types Table:', res);
            db.end();
        });
    });
});
