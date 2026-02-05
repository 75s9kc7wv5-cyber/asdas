const mysql = require('mysql2');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if(err) { console.error('Connection error:', err); process.exit(1); }
    console.log('Connected to DB.');
    
    // Check and Add log_type
    db.query("SHOW COLUMNS FROM ranch_logs LIKE 'log_type'", (err, res) => {
        if(err) { console.error(err); }
        else if(res.length === 0) {
            console.log('Adding log_type column...');
            db.query("ALTER TABLE ranch_logs ADD COLUMN log_type VARCHAR(20) DEFAULT NULL", (err) => {
                if(err) console.error('Failed to add log_type:', err);
                else console.log('log_type added successfully.');
                checkEarnings();
            });
        } else {
            console.log('log_type already exists.');
            checkEarnings();
        }
    });

    function checkEarnings() {
        db.query("SHOW COLUMNS FROM ranch_logs LIKE 'earnings'", (err, res) => {
             if(res.length === 0) {
                console.log('Adding earnings column...');
                db.query("ALTER TABLE ranch_logs ADD COLUMN earnings BIGINT DEFAULT 0", (err) => {
                    if(err) console.error(err);
                    else console.log('earnings added.');
                    checkAmount();
                });
             } else {
                 console.log('earnings exists.');
                 checkAmount();
             }
        });
    }

    function checkAmount() {
        db.query("SHOW COLUMNS FROM ranch_logs LIKE 'amount'", (err, res) => {
             if(res.length === 0) {
                console.log('Adding amount column...');
                db.query("ALTER TABLE ranch_logs ADD COLUMN amount INT DEFAULT 0", (err) => {
                    if(err) console.error(err);
                    else console.log('amount added.');
                    db.end();
                });
             } else {
                 console.log('amount exists.');
                 db.end();
             }
        });
    }
});
