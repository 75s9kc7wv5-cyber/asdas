const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database.');

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS hospital_levels (
            level INT PRIMARY KEY,
            capacity INT NOT NULL,
            treatment_duration INT NOT NULL,
            health_regen INT NOT NULL,
            treatment_price INT NOT NULL,
            upgrade_cost_money BIGINT NOT NULL,
            upgrade_cost_gold INT NOT NULL,
            upgrade_cost_diamond INT NOT NULL,
            upgrade_duration_minutes INT NOT NULL,
            req_lumber INT DEFAULT 0,
            req_brick INT DEFAULT 0,
            req_glass INT DEFAULT 0,
            req_concrete INT DEFAULT 0,
            req_steel INT DEFAULT 0
        )
    `;

    db.query(createTableQuery, (err) => {
        if (err) throw err;
        console.log('hospital_levels table created/checked.');

        // Generate Data for Levels 1-20
        const values = [];
        for (let lvl = 1; lvl <= 20; lvl++) {
            // Stats for THIS level (when you are at this level)
            const capacity = lvl * 5;
            const duration = Math.max(1, 16 - lvl); // Lvl 1: 15, Lvl 2: 14...
            const regen = 100; // Fixed regen
            const price = 100 + (lvl - 1) * 50; // Example: +50 per level

            // Costs to UPGRADE TO this level (from previous)
            // For Level 1, costs are 0 (initial state)
            let costMoney = 0;
            let costGold = 0;
            let costDiamond = 0;
            let upDuration = 0;
            let matLumber = 0;
            let matBrick = 0;
            let matGlass = 0;
            let matConcrete = 0;
            let matSteel = 0;

            if (lvl > 1) {
                const prevLvl = lvl - 1;
                costMoney = Math.floor(250000 * Math.pow(1.65, prevLvl - 1));
                costGold = Math.floor(100 * Math.pow(prevLvl, 1.8));
                costDiamond = (prevLvl >= 5) ? Math.floor(25 * Math.pow(prevLvl - 4, 2)) : 0;
                upDuration = Math.floor(10 * Math.pow(1.2, prevLvl - 1));
                
                matLumber = Math.floor(500 * prevLvl);
                matBrick = Math.floor(500 * prevLvl);
                matGlass = Math.floor(250 * prevLvl);
                matConcrete = Math.floor(250 * prevLvl);
                matSteel = Math.floor(100 * prevLvl);
            }

            values.push([lvl, capacity, duration, regen, price, costMoney, costGold, costDiamond, upDuration, matLumber, matBrick, matGlass, matConcrete, matSteel]);
        }

        const insertQuery = `
            INSERT INTO hospital_levels 
            (level, capacity, treatment_duration, health_regen, treatment_price, upgrade_cost_money, upgrade_cost_gold, upgrade_cost_diamond, upgrade_duration_minutes, req_lumber, req_brick, req_glass, req_concrete, req_steel) 
            VALUES ? 
            ON DUPLICATE KEY UPDATE 
            capacity=VALUES(capacity), treatment_duration=VALUES(treatment_duration), health_regen=VALUES(health_regen), treatment_price=VALUES(treatment_price),
            upgrade_cost_money=VALUES(upgrade_cost_money), upgrade_cost_gold=VALUES(upgrade_cost_gold), upgrade_cost_diamond=VALUES(upgrade_cost_diamond),
            upgrade_duration_minutes=VALUES(upgrade_duration_minutes),
            req_lumber=VALUES(req_lumber), req_brick=VALUES(req_brick), req_glass=VALUES(req_glass), req_concrete=VALUES(req_concrete), req_steel=VALUES(req_steel)
        `;

        db.query(insertQuery, [values], (err) => {
            if (err) throw err;
            console.log('hospital_levels data populated.');
            process.exit();
        });
    });
});
