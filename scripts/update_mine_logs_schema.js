const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to DB');

    // Add log_type column
    db.query("SHOW COLUMNS FROM mine_logs LIKE 'log_type'", (err, res) => {
        if(err) throw err;
        if(res.length === 0) {
            db.query("ALTER TABLE mine_logs ADD COLUMN log_type VARCHAR(50) DEFAULT 'PRODUCTION'", (err) => {
                if(err) console.error(err);
                else console.log('Added log_type column');
                
                // Add description column
                checkDesc();
            });
        } else {
            console.log('log_type column exists');
            checkDesc();
        }
    });

    function checkDesc() {
        db.query("SHOW COLUMNS FROM mine_logs LIKE 'description'", (err, res) => {
            if(err) throw err;
            if(res.length === 0) {
                db.query("ALTER TABLE mine_logs ADD COLUMN description VARCHAR(255) DEFAULT NULL", (err) => {
                    if(err) console.error(err);
                    else console.log('Added description column');
                    process.exit();
                });
            } else {
                console.log('description column exists');
                process.exit();
            }
        });
    }
});
