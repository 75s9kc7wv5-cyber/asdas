const mysql = require('mysql2');
const dbConfig = {
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
};

const con = mysql.createConnection(dbConfig);

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to database.");

    const sql = `
    CREATE TABLE IF NOT EXISTS bug_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        username VARCHAR(255),
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        admin_reply TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Table 'bug_reports' created or exists.");
        
        // Add index on user_id for faster lookups
        con.query("ALTER TABLE bug_reports ADD INDEX idx_user_id (user_id)", (err) => {
             // Ignore error if index exists
             if(err && err.code !== 'ER_DUP_KEYNAME') console.log("Index creation info:", err.message);
             process.exit();
        });
    });
});
