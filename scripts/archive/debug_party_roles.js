const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    
    console.log("Checking users and parties...");
    
    db.query('SELECT id, username, party_id, party_role, role FROM users WHERE party_id IS NOT NULL', (err, users) => {
        if (err) throw err;
        console.log("Users with party:", users);
        
        db.query('SELECT id, name, leader_id FROM parties', (err, parties) => {
            if (err) throw err;
            console.log("Parties:", parties);
            db.end();
        });
    });
});
