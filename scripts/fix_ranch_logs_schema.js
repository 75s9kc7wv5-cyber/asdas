
const mysql = require('mysql2');
const dbConfig = {
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
};

const db = mysql.createConnection(dbConfig);

const updates = [
    "ALTER TABLE ranch_logs ADD COLUMN amount INT DEFAULT 0",
    "ALTER TABLE ranch_active_workers ADD COLUMN IF NOT EXISTS end_time TIMESTAMP NULL",
    "ALTER TABLE ranch_active_workers ADD COLUMN IF NOT EXISTS amount INT DEFAULT 0"
];

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');
    
    runUpdates(0);
});

function runUpdates(index) {
    if (index >= updates.length) {
        console.log('All updates completed.');
        db.end();
        process.exit(0);
    }

    const query = updates[index];
    console.log(`Running: ${query}`);
    
    db.query(query, (err, result) => {
        if (err) {
             if (err.errno === 1060 || err.code === 'ER_DUP_FIELDNAME') {
                 console.log('Column already exists, skipping.');
            } else {
                console.error(`Error executing query: ${query}`, err);
            }
        } else {
            console.log('Success.');
        }
        runUpdates(index + 1);
    });
}
