const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const dropDailyJobsTable = `DROP TABLE IF EXISTS daily_jobs`;
    const createDailyJobsTable = `
        CREATE TABLE daily_jobs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            icon VARCHAR(50) DEFAULT 'fa-briefcase',
            time INT NOT NULL, -- seconds
            minLevel INT DEFAULT 1,
            costH INT DEFAULT 0,
            costE INT DEFAULT 0,
            reward_money INT DEFAULT 0,
            reward_xp INT DEFAULT 0,
            reward_gold INT DEFAULT 0,
            reward_diamond INT DEFAULT 0
        )
    `;

    const createActiveDailyJobsTable = `
        CREATE TABLE IF NOT EXISTS active_daily_jobs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            job_id INT NOT NULL,
            start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_time DATETIME NOT NULL,
            status VARCHAR(20) DEFAULT 'active', -- active, completed
            UNIQUE KEY unique_active_user (user_id)
        )
    `;

    const createCompletedDailyJobsTable = `
        CREATE TABLE IF NOT EXISTS completed_daily_jobs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            job_id INT NOT NULL,
            completed_at DATE NOT NULL,
            UNIQUE KEY unique_daily_completion (user_id, job_id, completed_at)
        )
    `;

    db.query(dropDailyJobsTable, (err) => {
        if (err) throw err;
        console.log('Dropped old daily_jobs table.');

        db.query(createDailyJobsTable, (err) => {
            if (err) throw err;
            console.log('daily_jobs table ready.');

            db.query(createActiveDailyJobsTable, (err) => {
                if (err) throw err;
                console.log('active_daily_jobs table ready.');

                db.query(createCompletedDailyJobsTable, (err) => {
                    if (err) throw err;
                    console.log('completed_daily_jobs table ready.');

                    // Insert Default Jobs
                    const jobs = [
                        { name: 'Broşür Dağıt', icon: 'fa-newspaper', time: 30, minLevel: 1, costH: 5, costE: 10, r_m: 100, r_x: 10, r_g: 0, r_d: 0 },
                        { name: 'Kargo Taşıma', icon: 'fa-box', time: 60, minLevel: 2, costH: 10, costE: 20, r_m: 250, r_x: 25, r_g: 0, r_d: 0 },
                        { name: 'Garsonluk', icon: 'fa-utensils', time: 120, minLevel: 3, costH: 15, costE: 30, r_m: 600, r_x: 50, r_g: 1, r_d: 0 },
                        { name: 'Güvenlik', icon: 'fa-shield-alt', time: 300, minLevel: 5, costH: 20, costE: 50, r_m: 1500, r_x: 120, r_g: 2, r_d: 0 },
                        { name: 'Yazılım İşi', icon: 'fa-laptop-code', time: 600, minLevel: 10, costH: 10, costE: 80, r_m: 5000, r_x: 300, r_g: 5, r_d: 1 }
                    ];

                    let completed = 0;
                    jobs.forEach(job => {
                        const insert = `INSERT INTO daily_jobs (name, icon, time, minLevel, costH, costE, reward_money, reward_xp, reward_gold, reward_diamond) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                        db.query(insert, [job.name, job.icon, job.time, job.minLevel, job.costH, job.costE, job.r_m, job.r_x, job.r_g, job.r_d], (err) => {
                            if (err) console.error(err);
                            else console.log(`Added job: ${job.name}`);
                            
                            completed++;
                            if (completed === jobs.length) {
                                console.log('All jobs added.');
                                setTimeout(() => process.exit(0), 500);
                            }
                        });
                    });
                });
            });
        });
    });
});
