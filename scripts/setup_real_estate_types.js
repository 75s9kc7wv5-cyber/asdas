const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

const types = [
    {
        id: 1,
        name: 'Dükkan',
        stats: {
            cost_money: 100000,
            cost_gold: 5,
            req_materials: JSON.stringify({brick:50, lumber:50, glass:20, concrete:10, steel:0}),
            income: 400,
            duration_hours: 1,
            image: 'icons/property-icon/dükkan.png'
        }
    },
    {
        id: 2, // Was Ev
        name: 'Müstakil Ev',
        stats: {
            cost_money: 500000,
            cost_gold: 25,
            req_materials: JSON.stringify({brick:300, lumber:150, glass:100, concrete:150, steel:50}),
            income: 1200,
            duration_hours: 4, // Increased duration
            image: 'icons/property-icon/ev.png'
        }
    },
    {
        id: 3, // Was Apartman
        name: 'Apartman',
        stats: {
            cost_money: 200000,
            cost_gold: 10,
            req_materials: JSON.stringify({brick:100, lumber:50, glass:50, concrete:50, steel:20}),
            income: 600,
            duration_hours: 2,
            image: 'icons/property-icon/apartman.png'
        }
    },
    {
        id: 4, // Was Kahve
        name: 'Kahve Dükkanı',
        stats: {
            cost_money: 350000,
            cost_gold: 15,
            req_materials: JSON.stringify({brick:150, lumber:80, glass:80, concrete:60, steel:30}),
            income: 900,
            duration_hours: 3,
            image: 'icons/property-icon/kahve dükkanı.png'
        }
    },
    {
        id: 5, // Was Lunapark
        name: 'Lunapark',
        stats: {
            cost_money: 12000000,
            cost_gold: 500,
            req_materials: JSON.stringify({brick:4000, lumber:2000, glass:1000, concrete:2000, steel:2500}),
            income: 15000,
            duration_hours: 24,
            image: 'icons/property-icon/lunapark.png'
        }
    },
    {
        id: 6, // Was Otopark
        name: 'Otopark',
        stats: {
            cost_money: 2500000,
            cost_gold: 100,
            req_materials: JSON.stringify({brick:800, lumber:100, glass:50, concrete:1000, steel:300}),
            income: 4500,
            duration_hours: 8,
            image: 'icons/property-icon/otopark.png'
        }
    },
    {
        id: 7, // Was Spor Salonu
        name: 'Spor Salonu',
        stats: {
            cost_money: 800000,
            cost_gold: 30,
            req_materials: JSON.stringify({brick:400, lumber:200, glass:150, concrete:250, steel:80}),
            income: 1800,
            duration_hours: 5,
            image: 'icons/property-icon/spor-salon.png'
        }
    },
    {
        id: 8, // Was Ofis (Skyscraper)
        name: 'İş Kulesi',
        stats: {
            cost_money: 5000000,
            cost_gold: 200,
            req_materials: JSON.stringify({brick:2000, lumber:1000, glass:2000, concrete:2000, steel:1000}),
            income: 7000,
            duration_hours: 10,
            image: 'icons/property-icon/ofis.png'
        }
    },
    {
        id: 9, // Was Otel (Residence)
        name: 'Rezidans',
        stats: {
            cost_money: 1500000,
            cost_gold: 50,
            req_materials: JSON.stringify({brick:600, lumber:300, glass:400, concrete:400, steel:150}),
            income: 3000,
            duration_hours: 6,
            image: 'icons/property-icon/otel.png'
        }
    },
    {
        id: 10, // Was AVM
        name: 'AVM',
        stats: {
            cost_money: 8000000,
            cost_gold: 300,
            req_materials: JSON.stringify({brick:3000, lumber:1500, glass:3000, concrete:3000, steel:1500}),
            income: 10000,
            duration_hours: 12,
            image: 'icons/property-icon/alısveris-merkezi.png'
        }
    }
];

db.connect(async err => {
    if (err) { console.error(err); process.exit(1); }

    console.log('Connected to DB. Updating property types...');

    // We use ON DUPLICATE KEY UPDATE to upsert
    const sql = `
        INSERT INTO property_types (id, name, cost_money, cost_gold, req_materials, income, duration_hours, image, price, tax_income, tax_interval, req_license_level, req_education_level, cost_diamond)
        VALUES ?
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        cost_money = VALUES(cost_money),
        cost_gold = VALUES(cost_gold),
        req_materials = VALUES(req_materials),
        income = VALUES(income),
        duration_hours = VALUES(duration_hours),
        image = VALUES(image),
        price = VALUES(price);
    `;

    const values = types.map(t => [
        t.id,
        t.name,
        t.stats.cost_money,
        t.stats.cost_gold,
        t.stats.req_materials,
        t.stats.income,
        t.stats.duration_hours,
        t.stats.image,
        t.stats.cost_money, // price
        t.stats.income, // tax_income (using same for simplicity for now)
        120, // tax_interval
        1, // license
        0, // education
        0 // diamond
    ]);

    db.query(sql, [values], (err, res) => {
        if(err) {
            console.error('Error upserting:', err);
        } else {
            console.log('Success:', res.affectedRows, 'rows affected.');
        }
        db.end();
    });
});
