
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) { console.error('Connection failed:', err); process.exit(1); }
    console.log('Connected to database.');

    const sql = "DELETE FROM user_properties";
    
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error deleting properties:', err);
        } else {
            console.log(`Deleted ${result.affectedRows} properties from user_properties.`);
        }
        
        // Optional: Reset User Business Real Estate Level?
        // Let's ask via prompt or just do it? User said "remove businesses". 
        // Likely means resetting everything about Real Estate.
        // I will reset the real_estate_level to 1 and balance to 0 in user_business table as well.
        
        const sqlReset = "UPDATE user_business SET real_estate_level = 1, real_estate_balance = 0";
        db.query(sqlReset, (err2, res2) => {
            if(err2) console.error('Error resetting business stats:', err2);
            else console.log(`Reset real_estate_level and balance for ${res2.affectedRows} users.`);
            
            process.exit();
        });
    });
});
