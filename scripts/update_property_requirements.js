const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld',
    multipleStatements: true // Enable multiple statements
});

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    // Helper to run query promise-style
    const run = (sql) => new Promise((resolve, reject) => {
        db.query(sql, (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });

    async function main() {
        try {
            // 1. Add columns (ignoring errors if they exist)
            try {
                await run(`ALTER TABLE property_types ADD COLUMN req_license_level INT DEFAULT 1`);
                console.log('Added req_license_level column.');
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') console.log('req_license_level already exists.');
                else console.error('Error adding req_license_level:', e.message);
            }

            try {
                await run(`ALTER TABLE property_types ADD COLUMN req_education_level INT DEFAULT 0`);
                console.log('Added req_education_level column.');
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') console.log('req_education_level already exists.');
                else console.error('Error adding req_education_level:', e.message);
            }

            // 2. Update Property Types
            const updates = [
                `UPDATE property_types SET req_license_level = 1, req_education_level = 0, req_materials = '{"lumber": 50}' WHERE id = 1`,
                `UPDATE property_types SET req_license_level = 1, req_education_level = 5, req_materials = '{"lumber": 150, "glass": 10}' WHERE id = 2`,
                `UPDATE property_types SET req_license_level = 2, req_education_level = 10, req_materials = '{"concrete": 50, "brick": 100, "glass": 20}' WHERE id = 3`,
                `UPDATE property_types SET req_license_level = 3, req_education_level = 20, req_materials = '{"concrete": 150, "steel": 20, "glass": 50}' WHERE id = 4`,
                `UPDATE property_types SET req_license_level = 4, req_education_level = 30, req_materials = '{"concrete": 300, "steel": 50, "lumber": 100}' WHERE id = 5`,
                `UPDATE property_types SET req_license_level = 5, req_education_level = 40, req_materials = '{"concrete": 500, "steel": 150, "glass": 200}' WHERE id = 6`,
                `UPDATE property_types SET req_license_level = 6, req_education_level = 50, req_materials = '{"concrete": 1000, "steel": 500, "glass": 500}' WHERE id = 7`,
                `UPDATE property_types SET req_license_level = 7, req_education_level = 70, req_materials = '{"concrete": 2500, "steel": 1500, "glass": 1500}' WHERE id = 8`,
                `UPDATE property_types SET req_license_level = 8, req_education_level = 90, req_materials = '{"concrete": 5000, "steel": 2000, "gold": 100}' WHERE id = 9`,
                `UPDATE property_types SET req_license_level = 10, req_education_level = 100, req_materials = '{"steel": 10000, "glass": 5000, "uranium": 500}' WHERE id = 10`
            ];

            for (const sql of updates) {
                await run(sql);
            }
            console.log('Updated property types.');

        } catch (err) {
            console.error('Main error:', err);
        } finally {
            db.end();
        }
    }

    main();
});
