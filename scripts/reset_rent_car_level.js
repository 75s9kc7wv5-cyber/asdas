const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const query = "UPDATE user_business SET level = 1";
    
    console.log(`Executing: ${query}`);
    
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error updating records:', error);
        } else {
            console.log(`Successfully updated ${results.changedRows} rows.`);
        }
        db.end();
        process.exit();
    });
});
