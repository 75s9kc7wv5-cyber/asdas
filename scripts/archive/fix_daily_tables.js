const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected.');

    const dropActive = `DROP TABLE IF EXISTS active_daily_jobs`;
    const dropCompleted = `DROP TABLE IF EXISTS completed_daily_jobs`;

    const createActive = `
        CREATE TABLE active_daily_jobs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            job_id INT NOT NULL,
            start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_time DATETIME NOT NULL,
            status VARCHAR(20) DEFAULT 'active',
            UNIQUE KEY unique_active_user (user_id)
        )
    `;

    const createCompleted = `
        CREATE TABLE completed_daily_jobs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            job_id INT NOT NULL,
            completed_at DATE NOT NULL,
            UNIQUE KEY unique_daily_completion (user_id, job_id, completed_at)
        )
    `;

    db.query(dropActive, (err) => {
        if(err) console.error(err);
        else console.log('Dropped active_daily_jobs');
        
        db.query(dropCompleted, (err) => {
            if(err) console.error(err);
            else console.log('Dropped completed_daily_jobs');
            
            db.query(createActive, (err) => {
                if(err) console.error(err);
                else console.log('Created active_daily_jobs');
                
                db.query(createCompleted, (err) => {
                    if(err) console.error(err);
                    else console.log('Created completed_daily_jobs');
                    db.end();
                });
            });
        });
    });
});
