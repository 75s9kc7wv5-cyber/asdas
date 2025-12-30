const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    console.log("Fixing party roles...");

    // 1. Set Leaders
    const updateLeaders = `
        UPDATE users u 
        JOIN parties p ON u.id = p.leader_id 
        SET u.party_role = 'Genel Başkan'
    `;
    
    db.query(updateLeaders, (err, result) => {
        if (err) console.error("Error updating leaders:", err);
        else console.log(`Updated ${result.changedRows} leaders to 'Genel Başkan'.`);

        // 2. Set Members (anyone with party_id but no party_role)
        const updateMembers = `
            UPDATE users 
            SET party_role = 'Üye' 
            WHERE party_id IS NOT NULL AND party_role IS NULL
        `;

        db.query(updateMembers, (err, result) => {
            if (err) console.error("Error updating members:", err);
            else console.log(`Updated ${result.changedRows} members to 'Üye'.`);
            
            db.end();
        });
    });
});
