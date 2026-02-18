
const mysql = require('mysql2');
const dbConfig = {
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
};

const db = mysql.createConnection(dbConfig);

const updates = [
    "ALTER TABLE player_ranches ADD COLUMN reserve INT DEFAULT 0",
    "ALTER TABLE player_ranches ADD COLUMN capacity INT DEFAULT 1000",
    "ALTER TABLE player_ranches ADD COLUMN vault INT DEFAULT 0",
    "ALTER TABLE player_ranches ADD COLUMN stock INT DEFAULT 0",
    "ALTER TABLE player_ranches ADD COLUMN efficiency INT DEFAULT 100",
    "ALTER TABLE player_ranches ADD COLUMN name VARCHAR(100) DEFAULT NULL"
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
            // Error Code 1060 is duplicate column
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
