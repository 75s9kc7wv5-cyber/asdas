const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(async (err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }

    console.log('Connected.');

    // Check users columns
    db.query('DESCRIBE users', (err, res) => {
        if (err) console.error(err);
        else {
            console.log('USERS TABLE COLUMNS:');
            console.log(res.map(r => r.Field));
        }

        // Check all tables for 'username' column
        db.query(`
            SELECT TABLE_NAME, COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE COLUMN_NAME = 'username' AND TABLE_SCHEMA = 'simworld'
        `, (err, res) => {
            if (err) console.error(err);
            else {
                console.log('\nTables with "username" column:');
                console.log(res.map(r => r.TABLE_NAME));
            }
            process.exit();
        });
    });
});
