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
    console.log('Connected to DB');

    const alterQuery = "ALTER TABLE daily_jobs ADD COLUMN reqEducation INT DEFAULT 0 AFTER minLevel";

    db.query(alterQuery, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column reqEducation already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column reqEducation added successfully.');
        }

        // Now update the jobs with education values
        const updates = [
            { name: "Resepsiyonist", val: 10 }, // Ilkokul
            { name: "Yazılımcı", val: 40 }, // Universite / Onlisans
            { name: "Doktor", val: 60 }, // Lisans
            { name: "Güvenlik Görevlisi", val: 5 } // Basic
        ];

        let completed = 0;
        updates.forEach(u => {
            db.query('UPDATE daily_jobs SET reqEducation = ? WHERE name = ?', [u.val, u.name], (err) => {
                if(err) console.error(err);
                completed++;
                if(completed === updates.length) {
                    console.log("Updated job education requirements.");
                    db.end();
                }
            });
        });
        
        if(updates.length === 0) db.end();
    });
});
