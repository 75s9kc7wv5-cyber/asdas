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

    const types = [
        ['Buğday Tarlası', 'wheat', 10000, 1, 'icons/farm-icon/wheat.png', 'Temel tahıl üretimi.'],
        ['Mısır Tarlası', 'corn', 12000, 1, 'icons/farm-icon/corn.png', 'Yüksek verimli mısır üretimi.'],
        ['Meyve Bahçesi', 'fruit', 15000, 2, 'icons/farm-icon/fruit.png', 'Çeşitli meyvelerin yetiştirildiği bahçe.'],
        ['Sebze Bahçesi', 'vegetable', 15000, 2, 'icons/farm-icon/vegetables.png', 'Taze sebze üretimi.'],
        ['Pirinç Tarlası', 'rice', 18000, 2, 'icons/farm-icon/rice.png', 'Sulak alanlarda pirinç tarımı.'],
        ['Patates Tarlası', 'potato', 14000, 1, 'icons/farm-icon/potato.png', 'Nişasta kaynağı patates üretimi.'],
        ['Zeytinlik', 'olive', 20000, 3, 'icons/farm-icon/olive.png', 'Değerli zeytin ve yağ üretimi.']
    ];

    let completed = 0;
    types.forEach(type => {
        const sql = "INSERT IGNORE INTO farm_types (name, slug, price, license_req, image_path, description) VALUES (?, ?, ?, ?, ?, ?)";
        db.query(sql, type, (err) => {
            if (err) console.error(err);
            else console.log(`Inserted/Ignored: ${type[0]}`);
            
            completed++;
            if (completed === types.length) {
                console.log('All field types processed.');
                db.end();
            }
        });
    });
});
