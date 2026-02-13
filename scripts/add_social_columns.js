const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('Veritabanına bağlanılamadı:', err);
        return;
    }
    console.log('Veritabanına bağlanıldı.');

    const columns = [
        "ADD COLUMN social_instagram BOOLEAN DEFAULT FALSE",
        "ADD COLUMN social_telegram BOOLEAN DEFAULT FALSE",
        "ADD COLUMN social_youtube BOOLEAN DEFAULT FALSE",
        "ADD COLUMN social_x BOOLEAN DEFAULT FALSE"
    ];

    let completed = 0;

    columns.forEach(col => {
        const query = `ALTER TABLE users ${col}`;
        db.query(query, (err) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Kolon zaten var: ${col}`);
                } else {
                    console.error(`Hata oluştu (${col}):`, err.message);
                }
            } else {
                console.log(`Kolon eklendi: ${col}`);
            }
            
            completed++;
            if (completed === columns.length) {
                console.log('İşlem tamamlandı.');
                db.end();
            }
        });
    });
});
