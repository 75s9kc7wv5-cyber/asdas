
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

const items = [
    'wood', 'stone', 'iron', 'coal', 'oil', 'diamond', 'uranium', 'energy', 'electricity', 
    'gold', 'gold_nugget', 'copper', 'sand', 
    'lumber', 'brick', 'glass', 'concrete', 'steel', 'silicon', 'plastic', 'chip', 
    'seed', 'feed', 'wool', 'egg', 'meat', 'honey', 
    'wheat', 'corn', 'potato', 'vegetable', 'fruit', 'rice', 'olive', 
    'copper_cable', 'gold_cable', 'electronic_card', 
    'tyre', 'engine', 'car', 
    'key_common', 'key_rare', 'key_epic', 'key_mystic', 
    'btc', 'gx_100', 'gx_300', 'gx_500', 'gx_800', 'gx_titan', 
    'bread', 'cake', 'salad', 'canned_fruit', 'cooked_meat', 'rice_dish', 'meat_dish', 'olive_oil', 'energy_bar', 
    'weapon', 'ammo', 'helmet', 
    'cable', 'gift_1', 'gift_2'
];

db.connect(err => {
    if (err) throw err;
    console.log('Connected to DB');

    db.query('SELECT id FROM users', (err, users) => {
        if (err) throw err;

        let completed = 0;
        const total = users.length * items.length;

        users.forEach(user => {
            items.forEach(item => {
                const sql = `
                    INSERT INTO inventory (user_id, item_key, quantity) 
                    VALUES (?, ?, 100) 
                    ON DUPLICATE KEY UPDATE quantity = IF(quantity < 100, 100, quantity)
                `;
                db.query(sql, [user.id, item], (err) => {
                    if (err) console.error(err);
                    completed++;
                    if (completed >= total) {
                        console.log('All items added to all users.');
                        process.exit();
                    }
                });
            });
        });
    });
});
