
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

    // 1. Remove Ownership (So users have to buy it again)
    const sqlDeleteOwnership = "DELETE FROM user_businesses WHERE business_type = 'real_estate'";
    
    db.query(sqlDeleteOwnership, (err, result) => {
        if (err) {
            console.error('Error deleting ownership:', err);
        } else {
            console.log(`Removed ownership for ${result.affectedRows} users (user_businesses).`);
        }

        // 2. Remove Properties (Assets owned by the business)
        const sqlDeleteProperties = "DELETE FROM user_properties";
        db.query(sqlDeleteProperties, (err, result) => {
             if (err) {
                console.error('Error deleting properties:', err);
            } else {
                console.log(`Deleted ${result.affectedRows} properties (user_properties).`);
            }

            // 3. Reset Business Stats (Level, Balance) in the unified stats table
            const sqlResetStats = "UPDATE user_business SET real_estate_level = 1, real_estate_balance = 0";
            db.query(sqlResetStats, (err, result) => {
                if (err) {
                    console.error('Error resetting stats:', err);
                } else {
                    console.log(`Reset stats for ${result.affectedRows} users (user_business).`);
                }
                process.exit();
            });
        });
    });
});
