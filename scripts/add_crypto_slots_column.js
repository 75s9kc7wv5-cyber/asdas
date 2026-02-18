const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err);
        return;
    }
    console.log('Veritabanına bağlanıldı.');

    const addColumnQuery = "ALTER TABLE users ADD COLUMN crypto_slots INT DEFAULT 1";

    db.query(addColumnQuery, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('crypto_slots sütunu zaten mevcut.');
            } else {
                console.error('Sütun ekleme hatası:', err);
            }
        } else {
            console.log('crypto_slots sütunu başarıyla eklendi.');
        }
        
        // Update existing users to have at least 1 slot if they have 0 or null (though default handles new ones)
        db.query("UPDATE users SET crypto_slots = 1 WHERE crypto_slots IS NULL OR crypto_slots = 0", (err, res) => {
             if(err) console.error("Update error:", err);
             else console.log("Mevcut kullanıcılar güncellendi.");
             process.exit();
        });
    });
});
