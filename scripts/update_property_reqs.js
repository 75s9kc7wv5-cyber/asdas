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
    console.log('Connected to database.');

    const updates = [
        {
            id: 1, // Gecekondu
            req: { lumber: 20, brick: 20, glass: 10, concrete: 5, steel: 2 }
        },
        {
            id: 2, // Ahşap Ev
            req: { lumber: 50, brick: 40, glass: 20, concrete: 10, steel: 5 }
        },
        {
            id: 3, // Betonarme Ev
            req: { lumber: 30, brick: 100, glass: 30, concrete: 50, steel: 10 }
        },
        {
            id: 4, // Apartman Dairesi
            req: { lumber: 50, brick: 200, glass: 100, concrete: 150, steel: 50 }
        },
        {
            id: 5, // Müstakil Villa
            req: { lumber: 100, brick: 300, glass: 150, concrete: 200, steel: 80 }
        },
        {
            id: 6, // Lüks Rezidans
            req: { lumber: 150, brick: 500, glass: 300, concrete: 400, steel: 150 }
        },
        {
            id: 7, // İş Merkezi
            req: { lumber: 200, brick: 800, glass: 500, concrete: 800, steel: 300 }
        },
        {
            id: 8, // Gökdelen
            req: { lumber: 300, brick: 1500, glass: 1000, concrete: 2000, steel: 1000 }
        },
        {
            id: 9, // Saray
            req: { lumber: 1000, brick: 3000, glass: 2000, concrete: 3000, steel: 2000 }
        },
        {
            id: 10, // Uzay İstasyonu
            req: { lumber: 5000, brick: 5000, glass: 5000, concrete: 5000, steel: 10000 }
        }
    ];

    let completed = 0;
    updates.forEach(item => {
        const sql = `UPDATE property_types SET req_materials = ? WHERE id = ?`;
        db.query(sql, [JSON.stringify(item.req), item.id], (err, result) => {
            if (err) {
                console.error(`Failed to update ID ${item.id}:`, err);
            } else {
                console.log(`Updated ID ${item.id}`);
            }
            completed++;
            if (completed === updates.length) {
                console.log('All updates finished.');
                db.end();
            }
        });
    });
});
