const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

const tiers = [
    { 
        ids: [1, 11], 
        money: 5000, 
        gold: 10, 
        diamond: 0, 
        mats: { lumber: 50, brick: 50, glass: 20, concrete: 20, steel: 5 } 
    },
    { 
        ids: [2, 12], 
        money: 15000, 
        gold: 25, 
        diamond: 0, 
        mats: { lumber: 100, brick: 100, glass: 40, concrete: 40, steel: 10 } 
    },
    { 
        ids: [3, 13], 
        money: 30000, 
        gold: 50, 
        diamond: 0, 
        mats: { lumber: 200, brick: 200, glass: 80, concrete: 80, steel: 25 } 
    },
    { 
        ids: [4, 14], 
        money: 75000, 
        gold: 100, 
        diamond: 0, 
        mats: { lumber: 400, brick: 400, glass: 150, concrete: 150, steel: 50 } 
    },
    { 
        ids: [5, 15], 
        money: 150000, 
        gold: 200, 
        diamond: 0, 
        mats: { lumber: 800, brick: 800, glass: 300, concrete: 300, steel: 100 } 
    },
    { 
        ids: [6, 16], 
        money: 300000, 
        gold: 350, 
        diamond: 0, 
        mats: { lumber: 1500, brick: 1500, glass: 600, concrete: 600, steel: 200 } 
    },
    { 
        ids: [7, 17], 
        money: 750000, 
        gold: 500, 
        diamond: 0, 
        mats: { lumber: 3000, brick: 3000, glass: 1200, concrete: 1200, steel: 400 } 
    },
    { 
        ids: [8, 18], 
        money: 2000000, 
        gold: 1000, 
        diamond: 0, 
        mats: { lumber: 6000, brick: 6000, glass: 2500, concrete: 2500, steel: 800 } 
    },
    { 
        ids: [9, 19], 
        money: 5000000, 
        gold: 2500, 
        diamond: 25, 
        mats: { lumber: 10000, brick: 10000, glass: 5000, concrete: 5000, steel: 2000 } 
    },
    { 
        ids: [10, 20], 
        money: 20000000, 
        gold: 5000, 
        diamond: 100, 
        mats: { lumber: 25000, brick: 25000, glass: 10000, concrete: 10000, steel: 5000 } 
    }
];

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to DB');

    let completed = 0;
    
    tiers.forEach(tier => {
        const jsonMats = JSON.stringify(tier.mats);
        
        tier.ids.forEach(id => {
            db.query(
                'UPDATE property_types SET cost_money = ?, cost_gold = ?, cost_diamond = ?, req_materials = ? WHERE id = ?',
                [tier.money, tier.gold, tier.diamond, jsonMats, id],
                (err, res) => {
                    if (err) console.error(`Error updating ID ${id}:`, err);
                    else console.log(`Updated ID ${id}: Money ${tier.money}, Gold ${tier.gold}, Diamond ${tier.diamond}, Mats ${jsonMats}`);
                }
            );
        });
    });

    // Give it a moment to finish async queries
    setTimeout(() => {
        console.log('Done');
        process.exit();
    }, 2000);
});
