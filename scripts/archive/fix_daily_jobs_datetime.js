const mysql = require('mysql2');
const dbConfig = {
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
};

const connection = mysql.createConnection(dbConfig);

connection.connect(err => {
    if (err) {
        console.error('Error connecting:', err);
        return;
    }
    console.log('Connected to database.');

    // 1. Check if completed_daily_jobs exists
    const checkTable = `SHOW TABLES LIKE 'completed_daily_jobs'`;
    connection.query(checkTable, (err, results) => {
        if (err) console.error(err);
        
        if (results.length === 0) {
            // Create table if not exists with DATETIME
            const createSql = `
                CREATE TABLE completed_daily_jobs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    job_id INT NOT NULL,
                    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_user_job (user_id, job_id)
                )
            `;
            connection.query(createSql, (err) => {
                if (err) console.error('Create table error:', err);
                else console.log('Table completed_daily_jobs created.');
                process.exit();
            });
        } else {
            // Table exists, check column type or alter it
            const alterSql = `ALTER TABLE completed_daily_jobs MODIFY COLUMN completed_at DATETIME DEFAULT CURRENT_TIMESTAMP`;
            connection.query(alterSql, (err) => {
                if (err) console.error('Alter table error:', err);
                else console.log('Table completed_daily_jobs altered to DATETIME.');
                process.exit();
            });
        }
    });
});
