const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const defaultAvatar = 'uploads/avatars/default.png';

    const query = `UPDATE users SET avatar = ? WHERE avatar IS NULL OR avatar = ''`;
    
    db.query(query, [defaultAvatar], (err, result) => {
        if (err) {
            console.error('Error updating avatars:', err);
        } else {
            console.log(`Updated ${result.changedRows} users to default avatar.`);
        }
        db.end();
    });
});
