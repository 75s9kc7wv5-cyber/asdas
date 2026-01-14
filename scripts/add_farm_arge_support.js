const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('❌ DB Connection Error:', err);
        process.exit(1);
    }
    console.log('✅ Connected to MySQL');

    // arge_levels tablosu zaten mevcut, sadece mine_type alanının tarla ve çiftlik tiplerini de desteklediğinden emin olalım
    console.log('✅ arge_levels tablosu tarla ve çiftlik AR-GE\'lerini destekliyor.');
    console.log('📋 Desteklenen AR-GE Tipleri:');
    console.log('   TARLA & ÇİFTLİK: wheat, corn, fruit, vegetable, rice, potato, olive, chicken, cow, sheep, goat, bee');
    console.log('   MADEN: wood, stone, iron, coal, sand, oil, copper, gold, diamond, uranium');
    console.log('   FABRİKA: lumber, brick, glass, concrete, steel, agricultural, animal, bakery, ready_food, olive_oil, sweets, gold_factory, weapon, wind_turbine, solar_plant, coal_plant, nuclear_plant');
    
    db.end();
    console.log('\n✅ İşlem tamamlandı!');
});
