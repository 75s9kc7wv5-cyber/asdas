
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('DB Bağlantı hatası:', err);
        process.exit(1);
    }
    console.log('DB Bağlandı.');

    const alterQuery = `
        ALTER TABLE users 
        ADD COLUMN daily_streak INT DEFAULT 0,
        ADD COLUMN last_daily_claim DATETIME DEFAULT NULL;
    `;

    db.query(alterQuery, (err) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Sütunlar zaten var, geçiliyor.');
            } else {
                console.error('Tablo güncelleme hatası:', err);
            }
        } else {
            console.log('Users tablosuna günlük ödül sütunları eklendi (daily_streak, last_daily_claim).');
        }
        db.end();
    });
});
