const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) throw err;
    console.log("Connected to DB");
    addJobs();
});

const newJobs = [
    {
        name: "Güvenlik Görevlisi",
        description: "Alışveriş merkezini ve insanları koru.",
        minLevel: 5,
        reqEducation: 5, // İlkokul
        costH: 5,
        costE: 10,
        money: 1500,
        xp: 30,
        time: 120,
        icon: "guard.png"
    },
    {
        name: "Kargo Çalışanı",
        description: "Paketleri zamanında ve sağlam bir şekilde teslim et.",
        minLevel: 3,
        reqEducation: 0,
        costH: 10,
        costE: 15,
        money: 1200,
        xp: 25,
        time: 90,
        icon: "cargo.png"
    },
    {
        name: "Resepsiyonist",
        description: "Misafirleri karşıla, otele giriş işlemlerini yap.",
        minLevel: 8,
        reqEducation: 15, // Ortaokul
        costH: 2,
        costE: 8,
        money: 1800,
        xp: 35,
        time: 150,
        icon: "receptionist.png"
    },
    {
        name: "Yazılımcı",
        description: "Karmaşık problemleri çöz ve yeni kodlar geliştir.",
        minLevel: 20,
        reqEducation: 45, // Lisans
        costH: 2,
        costE: 25,
        money: 5000,
        xp: 150,
        time: 300,
        icon: "developer.png"
    },
    {
        name: "Garson",
        description: "Müşterilere hizmet et ve siparişleri al.",
        minLevel: 2,
        reqEducation: 0,
        costH: 3,
        costE: 5,
        money: 800,
        xp: 15,
        time: 60,
        icon: "waiter.png"
    },
    {
        name: "Doktor",
        description: "Hastaları tedavi et ve reçete yaz.",
        minLevel: 25,
        reqEducation: 60, // Yüksek Lisans
        costH: 5,
        costE: 30,
        money: 8000,
        xp: 250,
        time: 400,
        icon: "doctor.png"
    }
];

function query(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
}

async function addJobs() {
    console.log("Adding/Updating jobs...");
    
    for (const job of newJobs) {
        try {
            const rows = await query('SELECT id FROM daily_jobs WHERE name = ?', [job.name]);
            if (rows.length > 0) {
                console.log(`Job ${job.name} exists. Updating icon, description, education.`);
                await query('UPDATE daily_jobs SET icon = ?, description = ?, reqEducation = ? WHERE name = ?', 
                    [job.icon, job.description, job.reqEducation, job.name]);
            } else {
                console.log(`Inserting job: ${job.name}`);
                await query(
                    `INSERT INTO daily_jobs 
                    (name, description, minLevel, reqEducation, costH, costE, reward_money, reward_xp, time, icon) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [job.name, job.description, job.minLevel, job.reqEducation, job.costH, job.costE, job.money, job.xp, job.time, job.icon]
                );
            }
        } catch (err) {
            console.error(`Error processing ${job.name}:`, err.message);
        }
    }
    
    console.log("Done.");
    db.end();
}
