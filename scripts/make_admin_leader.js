const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    
    // Make User 1 (Admin) the leader of Party 7
    db.query('UPDATE parties SET leader_id = 1 WHERE id = 7', (err) => {
        if(err) throw err;
        console.log("Party 7 leader set to User 1");
        
        db.query('UPDATE users SET party_role = "Genel Başkan" WHERE id = 1', (err) => {
            if(err) throw err;
            console.log("User 1 role set to Genel Başkan");
            
            db.query('UPDATE users SET party_role = "Üye" WHERE id = 3', (err) => {
                if(err) throw err;
                console.log("User 3 role set to Üye");
                db.end();
            });
        });
    });
});
