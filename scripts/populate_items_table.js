const mysql = require('mysql2/promise');

const itemsData = [
    // KAYNAKLAR
    { key: 'wood', name: 'Odun', image: 'icons/mine-icon/wood.png', category: 'kaynaklar', order: 1 },
    { key: 'stone', name: 'Taş', image: 'icons/mine-icon/stone.png', category: 'kaynaklar', order: 2 },
    { key: 'iron', name: 'Demir', image: 'icons/mine-icon/iron.png', category: 'kaynaklar', order: 3 },
    { key: 'coal', name: 'Kömür', image: 'icons/mine-icon/coal.png', category: 'kaynaklar', order: 4 },
    { key: 'oil', name: 'Petrol', image: 'icons/mine-icon/oil-barrel.png', category: 'kaynaklar', order: 5 },
    { key: 'diamond', name: 'Elmas', image: 'icons/inventory-icon/diamond.png', category: 'kaynaklar', order: 6 },
    { key: 'uranium', name: 'Uranyum', image: 'icons/mine-icon/uranium.png', category: 'kaynaklar', order: 7 },
    { key: 'electricity', name: 'Elektrik', image: 'icons/energy-factory-icon/battery.png', category: 'kaynaklar', order: 8 },
    { key: 'gold', name: 'Altın', image: 'icons/inventory-icon/gold.png', category: 'kaynaklar', order: 9 },
    { key: 'gold_nugget', name: 'Altın Parçası', image: 'icons/mine-icon/gold-nugget.png', category: 'kaynaklar', order: 10 },
    { key: 'copper', name: 'Bakır', image: 'icons/mine-icon/copper.png', category: 'kaynaklar', order: 11 },
    { key: 'sand', name: 'Kum', image: 'icons/mine-icon/sand.png', category: 'kaynaklar', order: 12 },
    { key: 'lumber', name: 'Tahta', image: 'icons/factory-icon/wood-plank.png', category: 'kaynaklar', order: 13 },
    { key: 'brick', name: 'Tuğla', image: 'icons/factory-icon/brick.png', category: 'kaynaklar', order: 14 },
    { key: 'glass', name: 'Cam', image: 'icons/factory-icon/window.png', category: 'kaynaklar', order: 15 },
    { key: 'concrete', name: 'Çimento', image: 'icons/factory-icon/cement.png', category: 'kaynaklar', order: 16 },
    { key: 'steel', name: 'Çelik', image: 'icons/factory-icon/steel.png', category: 'kaynaklar', order: 17 },
    { key: 'silicon', name: 'Silikon', image: 'icons/factory-icon/silikon.png', category: 'kaynaklar', order: 18 },
    { key: 'plastic', name: 'Plastik', image: 'icons/factory-icon/plastic.png', category: 'kaynaklar', order: 19 },
    { key: 'chip', name: 'Çip', image: 'icons/factory-icon/chip.png', category: 'kaynaklar', order: 20 },
    { key: 'seed', name: 'Tohum', image: 'icons/ranch-icon/seed.png', category: 'kaynaklar', order: 21 },
    { key: 'feed', name: 'Yem', image: 'icons/ranch-icon/sack.png', category: 'kaynaklar', order: 22 },
    { key: 'wool', name: 'Yün', image: 'icons/ranch-icon/wool.png', category: 'kaynaklar', order: 23 },
    { key: 'copper_cable', name: 'Bakır Kablo', image: 'icons/factory-icon/copper-cable.png', category: 'kaynaklar', order: 24 },
    { key: 'gold_cable', name: 'Altın Kablo', image: 'icons/factory-icon/gold-cable.png', category: 'kaynaklar', order: 25 },
    { key: 'electronic_card', name: 'Elektronik Kart', image: 'icons/factory-icon/electronic-board.png', category: 'kaynaklar', order: 26 },
    { key: 'tire', name: 'Lastik', image: 'icons/factory-icon/tire.png', category: 'kaynaklar', order: 27 },
    { key: 'engine', name: 'Motor', image: 'icons/factory-icon/car-engine.png', category: 'kaynaklar', order: 28 },
    { key: 'btc', name: 'Bitcoin', image: 'icons/inventory-icon/bitcoin.png', category: 'kaynaklar', order: 29 },
    { key: 'gx_100', name: 'GX-100', image: 'icons/video-card/GX-100.png', category: 'kaynaklar', order: 30 },
    { key: 'gx_300', name: 'GX-300', image: 'icons/video-card/GX-300.png', category: 'kaynaklar', order: 31 },
    { key: 'gx_500', name: 'GX-500', image: 'icons/video-card/GX-700.png', category: 'kaynaklar', order: 32 },
    { key: 'gx_800', name: 'GX-800', image: 'icons/video-card/GX-Eco.png', category: 'kaynaklar', order: 33 },
    { key: 'gx_titan', name: 'GX-Titan', image: 'icons/video-card/GX-Titan.png', category: 'kaynaklar', order: 34 },
    { key: 'cable', name: 'Kablo', image: 'icons/factory-icon/cable.png', category: 'kaynaklar', order: 35 },

    // GIDALAR
    { key: 'egg', name: 'Yumurta', image: 'icons/ranch-icon/egg.png', category: 'gidalar', order: 101 },
    { key: 'meat', name: 'Et', image: 'icons/ranch-icon/beef.png', category: 'gidalar', order: 102 },
    { key: 'honey', name: 'Bal', image: 'icons/ranch-icon/honey.png', category: 'gidalar', order: 103 },
    { key: 'wheat', name: 'Buğday', image: 'icons/farm-icon/wheat.png', category: 'gidalar', order: 104 },
    { key: 'corn', name: 'Mısır', image: 'icons/farm-icon/corn.png', category: 'gidalar', order: 105 },
    { key: 'potato', name: 'Patates', image: 'icons/farm-icon/potato.png', category: 'gidalar', order: 106 },
    { key: 'vegetable', name: 'Sebze', image: 'icons/farm-icon/vegetables.png', category: 'gidalar', order: 107 },
    { key: 'fruit', name: 'Meyve', image: 'icons/farm-icon/fruit.png', category: 'gidalar', order: 108 },
    { key: 'rice', name: 'Pirinç', image: 'icons/farm-icon/rice.png', category: 'gidalar', order: 109 },
    { key: 'olive', name: 'Zeytin', image: 'icons/farm-icon/olive.png', category: 'gidalar', order: 110 },
    { key: 'bread', name: 'Ekmek', image: 'icons/food-factory/bread.png', category: 'gidalar', energy: 5, consumable: true, order: 111 },
    { key: 'cake', name: 'Pasta', image: 'icons/food-factory/cupcake.png', category: 'gidalar', energy: 15, consumable: true, order: 112 },
    { key: 'salad', name: 'Salata', image: 'icons/food-factory/salad.png', category: 'gidalar', energy: 5, consumable: true, order: 113 },
    { key: 'canned_fruit', name: 'Konserve Meyve', image: 'icons/food-factory/fruit-canned.png', category: 'gidalar', energy: 5, consumable: true, order: 114 },
    { key: 'cooked_meat', name: 'Pişmiş Et', image: 'icons/food-factory/steak.png', category: 'gidalar', energy: 20, consumable: true, order: 115 },
    { key: 'rice_dish', name: 'Pilav', image: 'icons/food-factory/rice.png', category: 'gidalar', energy: 10, consumable: true, order: 116 },
    { key: 'meat_dish', name: 'Et Yemeği', image: 'icons/food-factory/steak-food.png', category: 'gidalar', energy: 25, consumable: true, order: 117 },
    { key: 'olive_oil', name: 'Zeytinyağı', image: 'icons/food-factory/olive-oil.png', category: 'gidalar', order: 118 },
    { key: 'energy_bar', name: 'Enerji Barı', image: 'icons/food-factory/energy-bar.png', category: 'gidalar', energy: 50, consumable: true, order: 119 },

    // DİĞER
    { key: 'noventis', name: 'Noventis', image: 'icons/car-icon/Noventis.png', category: 'diger', order: 201 },
    { key: 'stradeo', name: 'Stradeo', image: 'icons/car-icon/Stradeo.png', category: 'diger', order: 202 },
    { key: 'rugnar', name: 'Rugnar', image: 'icons/car-icon/Rugnar.png', category: 'diger', order: 203 },
    { key: 'veltrano', name: 'Veltrano', image: 'icons/car-icon/Veltrano.png', category: 'diger', order: 204 },
    { key: 'zentaro', name: 'Zentaro', image: 'icons/car-icon/Zentaro.png', category: 'diger', order: 205 },
    { key: 'key_common', name: 'Sıradan Anahtar', icon: 'fa-key', iconColor: 'ic-stone', category: 'diger', order: 206 },
    { key: 'key_rare', name: 'Nadir Anahtar', icon: 'fa-key', iconColor: 'ic-oil', category: 'diger', order: 207 },
    { key: 'key_epic', name: 'Epik Anahtar', icon: 'fa-key', iconColor: 'ic-purple', category: 'diger', order: 208 },
    { key: 'key_mystic', name: 'Mistik Anahtar', icon: 'fa-key', iconColor: 'ic-gold', category: 'diger', order: 209 },
    { key: 'weapon', name: 'Silah', icon: 'fa-crosshairs', iconColor: 'ic-iron', category: 'diger', order: 210 },
    { key: 'ammo', name: 'Mermi', icon: 'fa-burn', iconColor: 'ic-gold', category: 'diger', order: 211 },
    { key: 'helmet', name: 'Kask', icon: 'fa-hard-hat', iconColor: 'ic-green', category: 'diger', order: 212 }
];

async function populateItems() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'simuser',
        password: 'password',
        database: 'simworld'
    });

    console.log('🔄 Items tablosuna veri ekleniyor...');

    try {
        for (const item of itemsData) {
            const sql = `
                INSERT INTO items (item_key, name, image_path, icon, icon_color, category, energy_value, is_consumable, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    name = VALUES(name),
                    image_path = VALUES(image_path),
                    icon = VALUES(icon),
                    icon_color = VALUES(icon_color),
                    category = VALUES(category),
                    energy_value = VALUES(energy_value),
                    is_consumable = VALUES(is_consumable),
                    sort_order = VALUES(sort_order)
            `;
            
            await connection.execute(sql, [
                item.key,
                item.name,
                item.image || null,
                item.icon || null,
                item.iconColor || null,
                item.category,
                item.energy || 0,
                item.consumable || false,
                item.order
            ]);
        }

        console.log(`✅ ${itemsData.length} ürün başarıyla eklendi/güncellendi!`);
        
        // Verify
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM items');
        console.log(`📊 Toplam items tablosunda: ${rows[0].count} kayıt`);

    } catch (error) {
        console.error('❌ Hata:', error);
    } finally {
        await connection.end();
    }
}

populateItems();
