const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');

    // 1. Add education_skill and diamond to users if not exists
    const alterUsers = `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS education_skill INT DEFAULT 1,
        ADD COLUMN IF NOT EXISTS diamond INT DEFAULT 0;
    `;

    db.query(alterUsers, (err) => {
        if (err) console.error('Error altering users:', err);
        else console.log('Users table updated');

        // 2. Create active_educations table
        const createActiveEdu = `
            CREATE TABLE IF NOT EXISTS active_educations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                target_level INT NOT NULL,
                start_time BIGINT NOT NULL,
                end_time BIGINT NOT NULL,
                UNIQUE KEY unique_user (user_id)
            );
        `;

        db.query(createActiveEdu, (err) => {
            if (err) console.error('Error creating active_educations:', err);
            else console.log('active_educations table ready');

            // 3. Create user_logs table if not exists (for logging)
            const createLogs = `
                CREATE TABLE IF NOT EXISTS user_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    log_type VARCHAR(50),
                    message TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `;

            db.query(createLogs, (err) => {
                if (err) console.error('Error creating user_logs:', err);
                else console.log('user_logs table ready');
                
                db.end();
            });
        });
    });
});
