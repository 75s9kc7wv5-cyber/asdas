const mysql = require('mysql2');
// require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('DB Connection Error:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    // 1. Add last_login to users if not exists
    const checkColumn = "SHOW COLUMNS FROM users LIKE 'last_login'";
    db.query(checkColumn, (err, results) => {
        if (err) console.error(err);
        if (results.length === 0) {
            const addCol = "ALTER TABLE users ADD COLUMN last_login DATETIME DEFAULT NULL";
            db.query(addCol, (err) => {
                if (err) console.error('Error adding last_login:', err);
                else console.log('Added last_login column to users.');
                step2();
            });
        } else {
            console.log('last_login column already exists.');
            step2();
        }
    });
});

function step2() {
    // 2. Create profile_comments table
    const createComments = `
    CREATE TABLE IF NOT EXISTS profile_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        profile_user_id INT NOT NULL,
        author_user_id INT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (profile_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE CASCADE
    )`;

    db.query(createComments, (err) => {
        if (err) console.error('Error creating profile_comments:', err);
        else console.log('profile_comments table ready.');
        step3();
    });
}

function step3() {
    // 3. Create achievements table (optional, but good for structure)
    // For now, we might just calculate them dynamically, but let's create a table for unlocked ones if needed.
    // Actually, let's stick to dynamic calculation for simplicity as requested "add achievements" without specific storage requirement.
    // But to be safe, let's ensure we have a way to track them if they are one-time unlocks.
    // Let's skip a table for now and calculate based on stats in the API.
    
    console.log('Database updates complete.');
    db.end();
}
