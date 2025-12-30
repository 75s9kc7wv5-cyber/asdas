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
    
    db.query('DESCRIBE player_farms', (err, res) => {
        if(err) console.error('Describe player_farms failed:', err);
        else {
            console.log('--- player_farms ---');
            res.forEach(col => console.log(`${col.Field}: ${col.Type} (Null: ${col.Null})`));
        }

        db.query('DESCRIBE farm_levels', (err, res) => {
            if(err) console.error('Describe farm_levels failed:', err);
            else {
                console.log('\n--- farm_levels ---');
                res.forEach(col => console.log(`${col.Field}: ${col.Type}`));
            }
            db.end();
        });
    });
});
