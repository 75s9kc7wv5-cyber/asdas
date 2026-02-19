const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld',
    multipleStatements: true
});

db.connect(err => {
    if (err) {
        console.error('DB Connect Error:', err);
        process.exit(1);
    }
    console.log('Connected to DB');

    const sql = `
        ALTER TABLE banks ADD COLUMN IF NOT EXISTS transfer_fee DECIMAL(5,2) DEFAULT 2.00;
        ALTER TABLE banks ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error adding columns:', err);
            // Fallback for older MySQL versions that don't support IF NOT EXISTS in ALTER TABLE
            if (err.code === 'ER_PARSE_ERROR' || err.code === 'ER_SYNTAX_ERROR') {
                 console.log('Retrying without IF NOT EXISTS (one by one)...');
                 
                 db.query('ALTER TABLE banks ADD COLUMN transfer_fee DECIMAL(5,2) DEFAULT 2.00', (e1) => {
                     if(e1 && e1.code !== 'ER_DUP_FIELDNAME') console.error('Add transfer_fee failed:', e1);
                     else console.log('transfer_fee added/exists');
                     
                     db.query('ALTER TABLE banks ADD COLUMN level INT DEFAULT 1', (e2) => {
                         if(e2 && e2.code !== 'ER_DUP_FIELDNAME') console.error('Add level failed:', e2);
                         else console.log('level added/exists');
                         process.exit();
                     });
                 });
            } else {
                 process.exit(1);
            }
        } else {
            console.log('Columns added successfully');
            process.exit();
        }
    });
});
