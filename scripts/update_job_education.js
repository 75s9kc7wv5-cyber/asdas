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

    const updates = [
        { name: 'Broşür Dağıt', req: 1 },      // İlkokul
        { name: 'Temizlikçilik', req: 11 },    // Ortaokul
        { name: 'Garsonluk', req: 21 },        // Lise
        { name: 'Resepsiyonist', req: 31 },    // Ön Lisans
        { name: 'Güvenlik', req: 41 },         // Lisans
        { name: 'Şoförlük', req: 51 },         // Yüksek Lisans
        { name: 'Özel Ders', req: 61 },        // Doktora
        { name: 'Yazılımcı', req: 71 },        // Post-Doc
        { name: 'Mühendislik', req: 81 },      // Doçentlik
        { name: 'CEO', req: 91 }               // Profesörlük
    ];

    let completed = 0;

    updates.forEach(job => {
        const query = `UPDATE daily_jobs SET reqEducation = ? WHERE name = ?`;
        db.query(query, [job.req, job.name], (err, result) => {
            if (err) {
                console.error(`Failed to update ${job.name}:`, err);
            } else {
                console.log(`Updated ${job.name} -> ReqEdu: ${job.req}`);
            }
            
            completed++;
            if (completed === updates.length) {
                console.log('All jobs updated.');
                process.exit(0);
            }
        });
    });
});
