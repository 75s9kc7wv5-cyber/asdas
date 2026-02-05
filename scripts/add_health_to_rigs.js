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

    const addColumnQuery = "ALTER TABLE player_rigs ADD COLUMN health FLOAT DEFAULT 100.0";

    db.query(addColumnQuery, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('health sütunu zaten mevcut.');
            } else {
                console.error('Sütun ekleme hatası:', err);
            }
        } else {
            console.log('health sütunu başarıyla eklendi.');
        }
        
        // Update existing rigs to 100 if null
        db.query("UPDATE player_rigs SET health = 100.0 WHERE health IS NULL", (err, res) => {
             if(err) console.error("Update error:", err);
             else console.log("Mevcut rigler güncellendi.");
             process.exit();
        });
    });
});
