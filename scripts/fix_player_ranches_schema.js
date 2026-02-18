
const mysql = require('mysql2');
const dbConfig = {
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
};

const db = mysql.createConnection(dbConfig);

const updates = [
    "ALTER TABLE player_ranches ADD COLUMN IF NOT EXISTS reserve INT DEFAULT 0",
    "ALTER TABLE player_ranches ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 1000",
    "ALTER TABLE player_ranches ADD COLUMN IF NOT EXISTS vault INT DEFAULT 0",
    "ALTER TABLE player_ranches ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0",
    "ALTER TABLE player_ranches ADD COLUMN IF NOT EXISTS efficiency INT DEFAULT 100",
    "ALTER TABLE player_ranches ADD COLUMN IF NOT EXISTS name VARCHAR(100) DEFAULT NULL"
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
            console.error(`Error executing query: ${query}`, err);
        } else {
            console.log('Success.');
        }
        runUpdates(index + 1);
    });
}
