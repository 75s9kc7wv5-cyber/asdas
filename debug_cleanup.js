const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected.');

    const hospitalId = 1;

    db.query('SELECT * FROM hospital_active_treatments WHERE hospital_id = ? AND end_time <= NOW()', [hospitalId], (err, expiredTreatments) => {
        if (err) {
            console.error('Select error:', err);
            process.exit(1);
        }

        console.log('Expired treatments found:', expiredTreatments.length);
        console.log(expiredTreatments);

        if (expiredTreatments.length > 0) {
            let completed = 0;
            expiredTreatments.forEach(t => {
                console.log(`Processing treatment ${t.id} for user ${t.user_id}`);
                db.query('UPDATE users SET health = 100 WHERE id = ?', [t.user_id], (err, res) => {
                    if (err) console.error('Update user error:', err);
                    else console.log('User updated:', res);

                    db.query('DELETE FROM hospital_active_treatments WHERE id = ?', [t.id], (err, res) => {
                        if (err) console.error('Delete treatment error:', err);
                        else console.log('Treatment deleted:', res);

                        completed++;
                        if (completed === expiredTreatments.length) {
                            console.log('All done.');
                            process.exit();
                        }
                    });
                });
            });
        } else {
            console.log('No expired treatments.');
            process.exit();
        }
    });
});
