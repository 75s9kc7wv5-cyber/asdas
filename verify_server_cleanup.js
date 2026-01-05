const mysql = require('mysql2');
const axios = require('axios');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

const HOSPITAL_ID = 1;
const USER_ID = 1; // Assuming user 1 exists

db.connect(async (err) => {
    if (err) throw err;
    console.log('Connected to DB.');

    // 1. Insert expired treatment
    const expiredTime = new Date(Date.now() - 10000); // 10 seconds ago
    const query = `
        INSERT INTO hospital_active_treatments 
        (hospital_id, user_id, start_time, end_time, bed_index) 
        VALUES (?, ?, NOW(), ?, 0)
    `;

    db.query(query, [HOSPITAL_ID, USER_ID, expiredTime], async (err, result) => {
        if (err) {
            console.error('Insert error:', err);
            process.exit(1);
        }
        const treatmentId = result.insertId;
        console.log(`Inserted expired treatment ID: ${treatmentId}`);

        // 2. Call the API
        try {
            console.log('Calling API...');
            await axios.get(`http://localhost:3000/api/hospital/${HOSPITAL_ID}/details`);
            console.log('API called successfully.');
        } catch (error) {
            console.error('API call failed:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
            }
        }

        // 3. Check if deleted
        db.query('SELECT * FROM hospital_active_treatments WHERE id = ?', [treatmentId], (err, rows) => {
            if (err) {
                console.error('Check error:', err);
            } else {
                if (rows.length === 0) {
                    console.log('SUCCESS: Treatment was cleaned up by the server.');
                } else {
                    console.log('FAILURE: Treatment still exists.');
                    console.log(rows);
                }
            }
            
            // Cleanup if it failed (optional, but good practice)
            if (rows.length > 0) {
                db.query('DELETE FROM hospital_active_treatments WHERE id = ?', [treatmentId], () => process.exit());
            } else {
                process.exit();
            }
        });
    });
});
