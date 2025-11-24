const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

// Root Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Stats Endpoint
app.get('/api/stats', (req, res) => {
    const query = 'SELECT COUNT(*) as count FROM users';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ count: 0 });
        }
        res.json({ count: results[0].count });
    });
});

// Inventory Endpoints

// Get Inventory
app.get('/api/inventory/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = 'SELECT item_key, quantity FROM inventory WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        
        // Convert to object format { stone: 10, wood: 5 }
        const inventory = {};
        results.forEach(row => {
            inventory[row.item_key] = row.quantity;
        });
        res.json(inventory);
    });
});

// Add Item
app.post('/api/inventory/add', (req, res) => {
    const { userId, itemKey, amount } = req.body;
    
    const query = `
        INSERT INTO inventory (user_id, item_key, quantity) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
    `;
    
    db.query(query, [userId, itemKey, amount], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ success: true, message: 'Item added' });
    });
});

// Mine Endpoint
app.post('/api/mine', (req, res) => {
    const { userId, mineType } = req.body;

    if (!userId || !mineType) {
        return res.status(400).json({ success: false, message: 'Eksik parametre.' });
    }

    // 1. Kullanıcı Enerji ve Sağlık Kontrolü
    const userQuery = 'SELECT energy, health FROM users WHERE id = ?';
    db.query(userQuery, [userId], (err, userRes) => {
        if (err || userRes.length === 0) return res.status(500).json({ success: false, message: 'Kullanıcı hatası.' });
        
        const user = userRes[0];
        
        // AR-GE Seviyesini ve Rezervi Kontrol Et
        const argeQuery = 'SELECT level, reserve FROM arge_levels WHERE user_id = ? AND mine_type = ?';
        db.query(argeQuery, [userId, mineType], (err, argeResults) => {
            if (err) return res.status(500).json({ success: false, message: 'Veritabanı hatası.' });

            const argeLevel = argeResults.length > 0 ? argeResults[0].level : 1;
            let currentReserve = argeResults.length > 0 ? (argeResults[0].reserve || 1000) : 1000;

            // Tüketim Hesaplama (Seviye arttıkça düşer)
            // Lv 1: 10 Energy, 10 Health
            // Lv 10: ~5 Energy, ~5 Health
            const consumption = Math.max(5, 10 - Math.floor((argeLevel - 1) * 0.5));
            
            if (user.energy < consumption) return res.json({ success: false, message: 'Yetersiz Enerji!' });
            if (user.health < consumption) return res.json({ success: false, message: 'Sağlığın çok düşük!' });

            // Şans Hesaplama: Başlangıç %30, her seviye +%5 (Max %75)
            let baseChance = 0.30;
            let chanceIncrease = (argeLevel - 1) * 0.05;
            let totalChance = Math.min(baseChance + chanceIncrease, 0.75);

            // Rezerv Etkisi: Rezerv %20'nin altındaysa şans yarıya düşer
            const maxReserve = 5000 * argeLevel; // Yeni Kapasite Formülü
            if (currentReserve < (maxReserve * 0.2)) {
                totalChance *= 0.5;
            }

            const isSuccess = Math.random() < totalChance;
            let amount = 0;

            if (isSuccess) {
                // Miktar Hesaplama
                const minAmount = 1 + Math.floor((argeLevel - 1) / 2);
                const maxAmount = 3 + (argeLevel - 1);
                amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
                
                // Rezerv Düşüşü
                currentReserve = Math.max(0, currentReserve - amount);
            }

            // Transaction Başlat
            db.beginTransaction(err => {
                if (err) return res.status(500).json({ success: false, message: 'Transaction Error' });

                // 1. Kullanıcıdan Enerji/Sağlık Düş
                db.query('UPDATE users SET energy = energy - ?, health = health - ? WHERE id = ?', [consumption, consumption, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Update User Error' }));

                    // 2. Rezervi Güncelle (Eğer kayıt yoksa oluştur)
                    const upsertArge = `
                        INSERT INTO arge_levels (user_id, mine_type, level, reserve) 
                        VALUES (?, ?, 1, ?) 
                        ON DUPLICATE KEY UPDATE reserve = ?
                    `;
                    // Yeni rezerv değeri: isSuccess ise düştü, değilse aynı kaldı (veya az bir miktar düşebilir, şimdilik sadece bulursa düşsün)
                    // Not: Kullanıcı hiç arge kaydı yoksa level 1 olarak insert edilir.
                    // Default reserve 5000 for level 1
                    const defaultReserve = 5000;
                    const newReserveVal = isSuccess ? currentReserve : (argeResults.length > 0 ? argeResults[0].reserve : defaultReserve);

                    db.query(upsertArge, [userId, mineType, defaultReserve, newReserveVal], (err) => {
                         if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Update Reserve Error' }));

                         if (isSuccess) {
                            // 3. Envantere Ekle
                            const invQuery = `
                                INSERT INTO inventory (user_id, item_key, quantity) 
                                VALUES (?, ?, ?) 
                                ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
                            `;
                            db.query(invQuery, [userId, mineType, amount], (err) => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Inventory Error' }));
                                
                                db.commit(err => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                                    res.json({ 
                                        success: true, 
                                        amount: amount, 
                                        newEnergy: user.energy - consumption,
                                        newHealth: user.health - consumption,
                                        reserve: newReserveVal
                                    });
                                });
                            });
                         } else {
                             // Başarısız ama enerji gitti
                             db.commit(err => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                                res.json({ 
                                    success: false, 
                                    message: 'Maalesef, bu sefer bir şey bulamadın.',
                                    newEnergy: user.energy - consumption,
                                    newHealth: user.health - consumption,
                                    reserve: newReserveVal
                                });
                            });
                         }
                    });
                });
            });
        });
    });
});

// AR-GE Endpoints

// Get AR-GE Status (All Mines)
app.get('/api/arge/status/:userId', (req, res) => {
    const userId = req.params.userId;
    
    // First, check for any completed researches (Level & Reserve) and update them
    const checkQuery = 'SELECT * FROM arge_levels WHERE user_id = ? AND (is_researching = 1 OR is_reserve_researching = 1)';
    
    db.query(checkQuery, [userId], (err, researchingItems) => {
        if (err) return res.status(500).json({ error: err });
        
        const updates = [];
        const now = Date.now();
        
        researchingItems.forEach(item => {
            // 1. Level Upgrade Check
            if (item.is_researching && item.research_end_time <= now) {
                const newLevel = item.level + 1;
                const p = new Promise((resolve, reject) => {
                    const updateQ = 'UPDATE arge_levels SET level = ?, is_researching = 0, research_end_time = NULL WHERE id = ?';
                    db.query(updateQ, [newLevel, item.id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                updates.push(p);
            }

            // 2. Reserve Research Check
            if (item.is_reserve_researching && item.reserve_research_end_time <= now) {
                const currentLevel = item.level;
                const maxCapacity = 5000 * currentLevel;
                
                // Random amount between 30% and 100% of Max Capacity
                const minAmount = maxCapacity * 0.30;
                const maxAmount = maxCapacity;
                const foundAmount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
                
                // Add to current reserve, cap at Max Capacity? 
                // Prompt says "mevcut maksimum rezerv kapasitesine göre hesaplanmış yeni rezerv miktarı madenin rezervine eklensin"
                // Usually reserves are capped. Let's cap it.
                let newReserve = (item.reserve || 0) + foundAmount;
                if (newReserve > maxCapacity) newReserve = maxCapacity;

                const p = new Promise((resolve, reject) => {
                    const updateQ = 'UPDATE arge_levels SET reserve = ?, is_reserve_researching = 0, reserve_research_end_time = NULL WHERE id = ?';
                    db.query(updateQ, [newReserve, item.id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                updates.push(p);
            }
        });
        
        Promise.all(updates).then(() => {
            // Now fetch the final status
            const query = 'SELECT mine_type, level, research_end_time, is_researching, reserve, is_reserve_researching, reserve_research_end_time FROM arge_levels WHERE user_id = ?';
            db.query(query, [userId], (err, results) => {
                if (err) return res.status(500).json({ error: err });
                
                const argeMap = {};
                results.forEach(row => {
                    argeMap[row.mine_type] = row;
                });
                res.json(argeMap);
            });
        }).catch(err => {
            res.status(500).json({ error: 'Update failed' });
        });
    });
});

// Start Reserve Research
app.post('/api/reserve/research/start', (req, res) => {
    const { userId, mineType } = req.body;
    
    if (!userId || !mineType) return res.status(400).json({ success: false, message: 'Missing params' });

    // 1. Check if already researching reserve for this mine
    const checkQuery = 'SELECT * FROM arge_levels WHERE user_id = ? AND mine_type = ?';
    db.query(checkQuery, [userId, mineType], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'DB Error' });
        
        let argeData = results.length > 0 ? results[0] : null;
        
        // If no arge record exists, create one (Level 1)
        if (!argeData) {
             // Should ideally be created via mining or upgrade, but let's handle it if needed or assume it exists
             // For now, assume it exists or user can't research reserve of a mine they haven't interacted with?
             // Actually, if they are on the page, they probably have level 1 implicitly.
             // Let's assume level 1 if not found.
             argeData = { level: 1, is_reserve_researching: 0 };
        }

        if (argeData.is_reserve_researching) {
            return res.json({ success: false, message: 'Zaten rezerv aranıyor.' });
        }

        const currentLevel = argeData.level || 1;
        
        // Cost Calculation (Invented: Money = 2000 * Level, Gold = 10 * Level)
        const costMoney = 2000 * currentLevel;
        const costGold = 10 * currentLevel;

        // 2. Check User Resources
        const userQuery = 'SELECT money, gold FROM users WHERE id = ?';
        db.query(userQuery, [userId], (err, userRes) => {
            if (err || userRes.length === 0) return res.status(500).json({ success: false, message: 'User Error' });
            
            const user = userRes[0];
            if (user.money < costMoney || user.gold < costGold) {
                return res.json({ success: false, message: 'Yetersiz kaynak.' });
            }

            // 3. Start Research
            const durationSeconds = 10; // Fixed 10 seconds for testing
            const endTime = Date.now() + (durationSeconds * 1000);

            db.beginTransaction(err => {
                if (err) return res.status(500).json({ success: false, message: 'Transaction Error' });

                db.query('UPDATE users SET money = money - ?, gold = gold - ? WHERE id = ?', [costMoney, costGold, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Money Update Error' }));

                    const upsertQuery = `
                        INSERT INTO arge_levels (user_id, mine_type, level, is_reserve_researching, reserve_research_end_time) 
                        VALUES (?, ?, 1, 1, ?) 
                        ON DUPLICATE KEY UPDATE is_reserve_researching = 1, reserve_research_end_time = ?
                    `;

                    db.query(upsertQuery, [userId, mineType, endTime, endTime], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Arge Update Error' }));

                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                            res.json({ success: true, endTime: endTime });
                        });
                    });
                });
            });
        });
    });
});

// Start Research
app.post('/api/arge/start', (req, res) => {
    const { userId, mineType } = req.body;
    
    if (!userId || !mineType) return res.status(400).json({ success: false, message: 'Missing params' });

    // 1. Check Global Research Queue (Only 1 research at a time per user)
    const globalCheckQuery = 'SELECT * FROM arge_levels WHERE user_id = ? AND is_researching = 1';
    db.query(globalCheckQuery, [userId], (err, activeResearches) => {
        if (err) return res.status(500).json({ success: false, message: 'DB Error' });
        
        if (activeResearches.length > 0) {
            return res.json({ success: false, message: 'Zaten devam eden bir araştırma var.' });
        }

        // 2. Get Current Level & Resources
        const userQuery = 'SELECT money, gold FROM users WHERE id = ?';
        db.query(userQuery, [userId], (err, userRes) => {
            if (err || userRes.length === 0) return res.status(500).json({ success: false, message: 'User Error' });
            
            const user = userRes[0];
            
            // Get specific mine level
            const mineQuery = 'SELECT level FROM arge_levels WHERE user_id = ? AND mine_type = ?';
            db.query(mineQuery, [userId, mineType], (err, mineRes) => {
                if (err) return res.status(500).json({ success: false, message: 'Mine DB Error' });
                
                const currentLevel = mineRes.length > 0 ? mineRes[0].level : 1;
                const targetLevel = currentLevel + 1;
                
                if (currentLevel >= 10) {
                    return res.json({ success: false, message: 'Maksimum seviyeye ulaşıldı.' });
                }

                // Check License Level
                const licenseQuery = 'SELECT level FROM licenses WHERE user_id = ? AND mine_type = ?';
                db.query(licenseQuery, [userId, mineType], (err, licenseRes) => {
                    if (err) return res.status(500).json({ success: false, message: 'License DB Error' });
                    
                    const licenseLevel = licenseRes.length > 0 ? licenseRes[0].level : 0;
                    
                    if (licenseLevel < targetLevel) {
                        return res.json({ success: false, message: `Yetersiz Lisans! Bu madeni geliştirmek için ${targetLevel}. seviye lisans gerekiyor.` });
                    }

                    // Cost Calculation
                    const costMoney = Math.floor(5000 * Math.pow(1.8, currentLevel - 1));
                    const costGold = 50 * currentLevel;
                    
                    if (user.money < costMoney || user.gold < costGold) {
                        return res.json({ success: false, message: 'Yetersiz kaynak.' });
                    }
                    
                    // Duration Calculation
                    const durationSeconds = currentLevel * 60;
                    const endTime = Date.now() + (durationSeconds * 1000);
                    
                    // 3. Deduct Resources & Start Research
                    db.beginTransaction(err => {
                        if (err) return res.status(500).json({ success: false, message: 'Transaction Error' });
                        
                        db.query('UPDATE users SET money = money - ?, gold = gold - ? WHERE id = ?', [costMoney, costGold, userId], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Money Update Error' }));
                            
                            const upsertQuery = `
                                INSERT INTO arge_levels (user_id, mine_type, level, is_researching, research_end_time) 
                                VALUES (?, ?, 1, 1, ?) 
                                ON DUPLICATE KEY UPDATE is_researching = 1, research_end_time = ?
                            `;
                            
                            db.query(upsertQuery, [userId, mineType, endTime, endTime], (err) => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Arge Update Error' }));
                                
                                db.commit(err => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                                    res.json({ success: true, endTime: endTime });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Finish Research
app.post('/api/arge/finish', (req, res) => {
    const { userId, mineType } = req.body;
    
    const query = 'SELECT level, research_end_time, is_researching FROM arge_levels WHERE user_id = ? AND mine_type = ?';
    
    db.query(query, [userId, mineType], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length === 0) return res.status(400).json({ success: false, message: 'No record' });
        
        const data = results[0];
        
        if (!data.is_researching) {
            return res.json({ success: false, message: 'Aktif araştırma yok.' });
        }
        
        if (Date.now() < data.research_end_time) {
            return res.json({ success: false, message: 'Araştırma henüz bitmedi.' });
        }
        
        // Level Up
        const newLevel = data.level + 1;
        const updateQuery = 'UPDATE arge_levels SET level = ?, is_researching = 0, research_end_time = NULL WHERE user_id = ? AND mine_type = ?';
        
        db.query(updateQuery, [newLevel, userId, mineType], (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true, newLevel: newLevel });
        });
    });
});

// User Stats Endpoint
app.get('/api/user-stats/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = 'SELECT money, gold, diamond, health, energy, level, license_hospital_level FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(results[0]);
    });
});

// Get Licenses
app.get('/api/licenses/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = 'SELECT mine_type, level FROM licenses WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        const licenses = {};
        results.forEach(row => {
            licenses[row.mine_type] = row.level;
        });
        res.json(licenses);
    });
});

// Buy/Upgrade License
app.post('/api/licenses/buy', (req, res) => {
    const { userId, mineType } = req.body;
    
    // Special handling for Hospital License
    if (mineType === 'hospital') {
        const userQuery = 'SELECT money, gold, license_hospital_level FROM users WHERE id = ?';
        db.query(userQuery, [userId], (err, userRes) => {
            if (err || userRes.length === 0) return res.status(500).json({ success: false, message: 'Kullanıcı bulunamadı.' });
            
            const user = userRes[0];
            const currentLevel = user.license_hospital_level || 0;
            const nextLevel = currentLevel + 1;

            if (nextLevel > 10) {
                return res.json({ success: false, message: 'Maksimum seviyeye ulaşıldı.' });
            }

            const moneyCost = Math.floor(1000 * Math.pow(1.5, nextLevel - 1));
            const goldCost = nextLevel > 1 ? 10 * (nextLevel - 1) : 0;

            if (user.money < moneyCost || user.gold < goldCost) {
                return res.json({ success: false, message: 'Yetersiz bakiye.' });
            }

            db.beginTransaction(err => {
                if (err) return res.status(500).json({ success: false, message: 'İşlem başlatılamadı.' });

                const updateQuery = 'UPDATE users SET money = money - ?, gold = gold - ?, license_hospital_level = ? WHERE id = ?';
                db.query(updateQuery, [moneyCost, goldCost, nextLevel, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Güncelleme hatası.' }));

                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                        res.json({ success: true, newLevel: nextLevel, moneyCost, goldCost });
                    });
                });
            });
        });
        return;
    }

    // 1. Get Current Level
    const checkQuery = 'SELECT level FROM licenses WHERE user_id = ? AND mine_type = ?';
    db.query(checkQuery, [userId, mineType], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Veritabanı hatası (Lisans Kontrol)', error: err });
        
        const currentLevel = results.length > 0 ? results[0].level : 0;
        const nextLevel = currentLevel + 1;
        
        if (nextLevel > 10) {
            return res.json({ success: false, message: 'Maksimum seviyeye ulaşıldı.' });
        }

        // 2. Calculate Cost
        // Formula: Money = 1000 * (1.5 ^ (Level-1)), Gold = 10 * (Level-1)
        // Level 1: 1000 Money, 0 Gold
        // Level 2: 1500 Money, 10 Gold
        // Level 3: 2250 Money, 20 Gold
        const moneyCost = Math.floor(1000 * Math.pow(1.5, nextLevel - 1));
        const goldCost = nextLevel > 1 ? 10 * (nextLevel - 1) : 0;

        // 3. Check Balance
        const userQuery = 'SELECT money, gold FROM users WHERE id = ?';
        db.query(userQuery, [userId], (err, userRes) => {
            if (err || userRes.length === 0) return res.status(500).json({ success: false, message: 'Kullanıcı bulunamadı.' });
            
            const user = userRes[0];
            if (user.money < moneyCost || user.gold < goldCost) {
                return res.json({ success: false, message: 'Yetersiz bakiye.' });
            }

            // 4. Deduct & Update (Transaction)
            db.beginTransaction(err => {
                if (err) return res.status(500).json({ success: false, message: 'İşlem başlatılamadı.' });

                const updateBalance = 'UPDATE users SET money = money - ?, gold = gold - ? WHERE id = ?';
                db.query(updateBalance, [moneyCost, goldCost, userId], (err) => {
                    if (err) {
                        return db.rollback(() => res.status(500).json({ success: false, message: 'Bakiye güncellenemedi.', details: err }));
                    }
                    
                    const upsertLicense = `
                        INSERT INTO licenses (user_id, mine_type, level) VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE level = ?
                    `;
                    db.query(upsertLicense, [userId, mineType, nextLevel, nextLevel], (err) => {
                        if (err) {
                            console.error("License Upsert Error:", err);
                            return db.rollback(() => res.status(500).json({ success: false, message: 'Lisans güncellenemedi.', details: err }));
                        }
                        
                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'İşlem tamamlanamadı.' }));
                            res.json({ success: true, newLevel: nextLevel, moneyCost, goldCost });
                        });
                    });
                });
            });
        });
    });
});

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser', 
    password: 'simpass', 
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('MySQL connection failed:', err);
        // If password fails, user might need to set one, but usually empty works in dev containers or 'root'
    } else {
        console.log('Connected to MySQL database.');

        // Create Licenses Table
        const createLicensesTable = `
            CREATE TABLE IF NOT EXISTS licenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                mine_type VARCHAR(50) NOT NULL,
                level INT DEFAULT 0,
                UNIQUE KEY unique_license (user_id, mine_type)
            )
        `;
        db.query(createLicensesTable, (err) => {
            if (err) console.error('Error creating licenses table:', err);
            else console.log('Licenses table ready.');
        });

        // Create Hospitals Table
        const createHospitalsTable = `
            CREATE TABLE IF NOT EXISTS hospitals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                level INT DEFAULT 1,
                capacity INT DEFAULT 5,
                price INT DEFAULT 100,
                quality INT DEFAULT 1,
                treatment_price INT DEFAULT 100,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_owner (user_id)
            )
        `;
        db.query(createHospitalsTable, (err) => {
            if (err) console.error('Error creating hospitals table:', err);
            else console.log('Hospitals table ready.');
        });

        // Create Hospital Treatments Table
        const createTreatmentsTable = `
            CREATE TABLE IF NOT EXISTS hospital_treatments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                hospital_id INT NOT NULL,
                bed_index INT NOT NULL,
                user_id INT NOT NULL,
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP NOT NULL,
                heal_amount INT DEFAULT 0,
                is_completed BOOLEAN DEFAULT FALSE,
                INDEX (hospital_id),
                INDEX (user_id)
            )
        `;
        db.query(createTreatmentsTable, (err) => {
            if (err) console.error('Error creating hospital_treatments table:', err);
            else console.log('Hospital Treatments table ready.');
        });

        // --- BANKING SYSTEM TABLES ---
        
        // Banks Table
        const createBanksTable = `
            CREATE TABLE IF NOT EXISTS banks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                owner_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                interest_rate DECIMAL(5,2) DEFAULT 1.00,
                loan_rate DECIMAL(5,2) DEFAULT 5.00,
                transfer_fee DECIMAL(5,2) DEFAULT 2.00,
                balance BIGINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_owner (owner_id)
            )
        `;
        db.query(createBanksTable, (err) => {
            if (err) console.error('Error creating banks table:', err);
            else console.log('Banks table ready.');
        });

        // Bank Accounts Table
        const createBankAccountsTable = `
            CREATE TABLE IF NOT EXISTS bank_accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bank_id INT NOT NULL,
                user_id INT NOT NULL,
                balance BIGINT DEFAULT 0,
                loan_debt BIGINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_account (bank_id, user_id)
            )
        `;
        db.query(createBankAccountsTable, (err) => {
            if (err) console.error('Error creating bank_accounts table:', err);
            else console.log('Bank Accounts table ready.');
        });
    }
});

// Routes

// Register
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Kullanıcı adı ve şifre gereklidir.' });
    }

    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(query, [username, password], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Bu kullanıcı adı zaten alınmış.' });
            }
            return res.status(500).json({ message: 'Veritabanı hatası.' });
        }
        res.status(201).json({ message: 'Kayıt başarılı.' });
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Kullanıcı adı ve şifre gereklidir.' });
    }

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Veritabanı hatası.' });
        }

        if (results.length > 0) {
            const user = results[0];
            res.json({ 
                message: 'Giriş başarılı.',
                user: { id: user.id, username: user.username }
            });
        } else {
            res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı.' });
        }
    });
});

// Hospital Endpoints

// Get All Hospitals (City List)
app.get('/api/hospitals', (req, res) => {
    const query = `
        SELECT h.id, h.user_id, h.name, h.level, h.capacity, h.treatment_price as price, h.quality, h.created_at, u.username as owner_name 
        FROM hospitals h 
        JOIN users u ON h.user_id = u.id 
        ORDER BY h.quality DESC, h.treatment_price ASC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Get My Hospital
app.get('/api/hospitals/my/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = 'SELECT *, treatment_price as price FROM hospitals WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Veritabanı hatası.' });
        if (results.length === 0) return res.json({ success: true, hasHospital: false });
        res.json({ success: true, hasHospital: true, hospital: results[0] });
    });
});

// Buy Hospital
app.post('/api/hospitals/buy', (req, res) => {
    const { userId, name } = req.body;
    const hospitalName = name || 'Şehir Hastanesi';
    
    // Costs
    const BASE_PRICE = 50000;
    const GOLD_PRICE = 500;
    const TAX_RATE = 0.10;
    const TAX_AMOUNT = BASE_PRICE * TAX_RATE;
    const TOTAL_MONEY = BASE_PRICE + TAX_AMOUNT;

    // 1. Check if user already has a hospital
    const checkHospital = 'SELECT id FROM hospitals WHERE user_id = ?';
    db.query(checkHospital, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Veritabanı hatası.' });
        if (results.length > 0) {
            return res.json({ success: false, message: 'Zaten bir hastaneniz var.' });
        }

        // 2. Check License
        const checkLicense = 'SELECT level FROM licenses WHERE user_id = ? AND mine_type = "hospital"';
        db.query(checkLicense, [userId], (err, licenseRes) => {
            if (err) return res.status(500).json({ success: false, message: 'Lisans kontrol hatası.' });
            
            const licenseLevel = licenseRes.length > 0 ? licenseRes[0].level : 0;
            if (licenseLevel < 1) {
                return res.json({ success: false, message: 'Hastane satın almak için "Hastane Lisansı" gereklidir.' });
            }

            // 3. Check Balance
            const checkBalance = 'SELECT money, gold FROM users WHERE id = ?';
            db.query(checkBalance, [userId], (err, userRes) => {
                if (err) return res.status(500).json({ success: false, message: 'Kullanıcı hatası.' });
                const user = userRes[0];

                if (user.money < TOTAL_MONEY || user.gold < GOLD_PRICE) {
                    return res.json({ success: false, message: `Yetersiz bakiye. Gereken: ${TOTAL_MONEY} TL (Vergi Dahil) ve ${GOLD_PRICE} Altın.` });
                }

                // 4. Transaction: Deduct & Create
                db.beginTransaction(err => {
                    if (err) return res.status(500).json({ success: false, message: 'İşlem başlatılamadı.' });

                    const updateBalance = 'UPDATE users SET money = money - ?, gold = gold - ? WHERE id = ?';
                    db.query(updateBalance, [TOTAL_MONEY, GOLD_PRICE, userId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Bakiye düşülemedi.' }));

                        const createHospital = 'INSERT INTO hospitals (user_id, name, capacity, quality, treatment_price) VALUES (?, ?, 5, 100, 100)';
                        db.query(createHospital, [userId, hospitalName], (err) => {
                            if (err) {
                                console.error("Hospital Create Error:", err);
                                return db.rollback(() => res.status(500).json({ success: false, message: 'Hastane oluşturulamadı.' }));
                            }

                            db.commit(err => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'İşlem onaylanamadı.' }));
                                res.json({ success: true, message: 'Hastane başarıyla satın alındı!' });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Get Hospital Details & Beds
app.get('/api/hospital/:id/details', (req, res) => {
    const hospitalId = req.params.id;
    
    const hospQuery = `
        SELECT h.*, u.username as owner_name 
        FROM hospitals h 
        JOIN users u ON h.user_id = u.id 
        WHERE h.id = ?
    `;
    
    db.query(hospQuery, [hospitalId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'DB Error' });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Hastane bulunamadı.' });
        
        const hospital = results[0];
        
        // Get Active Treatments (All occupied beds)
        const activeTreatQuery = `
            SELECT t.bed_index, t.end_time, u.username 
            FROM hospital_treatments t
            JOIN users u ON t.user_id = u.id
            WHERE t.hospital_id = ? AND t.end_time > NOW()
        `;
        
        db.query(activeTreatQuery, [hospitalId], (err, activeRes) => {
            if (err) return res.status(500).json({ success: false, message: 'Active Treatment DB Error' });
            
            // Get History (Last 10)
            const historyQuery = `
                SELECT t.start_time, t.heal_amount, u.username, h.level as hospital_level
                FROM hospital_treatments t
                JOIN users u ON t.user_id = u.id
                JOIN hospitals h ON t.hospital_id = h.id
                WHERE t.hospital_id = ?
                ORDER BY t.start_time DESC
                LIMIT 10
            `;

            db.query(historyQuery, [hospitalId], (err, historyRes) => {
                if (err) return res.status(500).json({ success: false, message: 'History DB Error' });
                
                res.json({ 
                    success: true, 
                    data: hospital, 
                    activeTreatments: activeRes,
                    history: historyRes
                });
            });
        });
    });
});

// Treat Player (New Logic with Capacity & Levels)
app.post('/api/hospital/treat', (req, res) => {
    const { userId, hospitalId } = req.body;

    // 1. Get Hospital Info
    const hospQuery = 'SELECT * FROM hospitals WHERE id = ?';
    db.query(hospQuery, [hospitalId], (err, hospRes) => {
        if (err || hospRes.length === 0) return res.status(404).json({ success: false, message: 'Hastane bulunamadı.' });
        
        const hospital = hospRes[0];
        const price = hospital.treatment_price || 100;
        const maxCapacity = hospital.capacity || (hospital.level * 5);
        const healAmount = hospital.level * 10;

        // 0. Check if user is already being treated anywhere
        const activeUserTreatQuery = 'SELECT id FROM hospital_treatments WHERE user_id = ? AND end_time > NOW()';
        db.query(activeUserTreatQuery, [userId], (err, activeRes) => {
            if (err) return res.status(500).json({ success: false, message: 'Active Check Error' });
            if (activeRes.length > 0) return res.json({ success: false, message: 'Zaten şu anda tedavi görüyorsunuz.' });

            // 2. Check Bed Availability
            const bedQuery = 'SELECT bed_index FROM hospital_treatments WHERE hospital_id = ? AND end_time > NOW()';
            db.query(bedQuery, [hospitalId], (err, bedRes) => {
                if (err) return res.status(500).json({ success: false, message: 'Bed Check Error' });
                
                const occupiedBeds = bedRes.map(b => b.bed_index);
                if (occupiedBeds.length >= maxCapacity) {
                    return res.json({ success: false, message: 'Kapasite dolu.' });
                }

                // Find first empty bed
                let assignedBed = -1;
                for (let i = 1; i <= maxCapacity; i++) {
                    if (!occupiedBeds.includes(i)) {
                        assignedBed = i;
                        break;
                    }
                }

                if (assignedBed === -1) return res.json({ success: false, message: 'Kapasite dolu.' });

                // 3. Check User
                const userQuery = 'SELECT money, health FROM users WHERE id = ?';
                db.query(userQuery, [userId], (err, userRes) => {
                    if (err || userRes.length === 0) return res.status(500).json({ success: false, message: 'User error' });
                    
                    const user = userRes[0];
                    if (user.money < price) return res.json({ success: false, message: 'Yetersiz para.' });
                    if (user.health >= 100) return res.json({ success: false, message: 'Sağlığınız zaten dolu.' });

                    // 4. Transaction
                    db.beginTransaction(err => {
                        if (err) return res.status(500).json({ success: false, message: 'Tx Error' });

                        const updateUser = 'UPDATE users SET money = money - ? WHERE id = ?';
                        db.query(updateUser, [price, userId], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Update User Error' }));

                            // Add Money to Hospital Vault (100% share to hospital balance)
                            const updateHospitalBalance = 'UPDATE hospitals SET balance = balance + ? WHERE id = ?';
                            db.query(updateHospitalBalance, [price, hospitalId], (err) => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Update Hospital Balance Error' }));

                                // Create Treatment Record (5 minutes = 300 seconds)
                                const duration = 300;
                                const endTime = new Date(Date.now() + duration * 1000);
                                
                                const insertTreat = 'INSERT INTO hospital_treatments (hospital_id, bed_index, user_id, end_time, heal_amount) VALUES (?, ?, ?, ?, ?)';
                                db.query(insertTreat, [hospitalId, assignedBed, userId, endTime, healAmount], (err) => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Insert Treatment Error' }));

                                    db.commit(err => {
                                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                                        
                                        setTimeout(() => {
                                            const healQuery = 'UPDATE users SET health = LEAST(100, health + ?) WHERE id = ?';
                                            db.query(healQuery, [healAmount, userId], (err) => {
                                                if (err) console.error('Auto-heal failed for user', userId);
                                            });
                                        }, duration * 1000);

                                        res.json({ success: true, message: 'Tedavi başladı!', endTime: endTime, bedIndex: assignedBed });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Start Hospital Upgrade
app.post('/api/hospital/upgrade/start', (req, res) => {
    const { userId, hospitalId } = req.body;

    const hospQuery = 'SELECT * FROM hospitals WHERE id = ?';
    db.query(hospQuery, [hospitalId], (err, hospRes) => {
        if (err || hospRes.length === 0) return res.status(404).json({ success: false, message: 'Hastane bulunamadı.' });
        
        const hospital = hospRes[0];
        if (hospital.user_id !== userId) return res.status(403).json({ success: false, message: 'Bu hastane size ait değil.' });
        if (hospital.level >= 10) return res.json({ success: false, message: 'Maksimum seviyeye ulaşıldı.' });
        if (hospital.upgrade_end_time) return res.json({ success: false, message: 'Zaten geliştirme yapılıyor.' });

        const nextLevel = hospital.level + 1;
        const costMoney = hospital.level * 25000;
        const costGold = hospital.level * 50;
        const requiredLicense = nextLevel;

        const userQuery = 'SELECT money, gold, license_hospital_level FROM users WHERE id = ?';
        db.query(userQuery, [userId], (err, userRes) => {
            if (err || userRes.length === 0) return res.status(500).json({ success: false, message: 'User error' });
            
            const user = userRes[0];
            const userLicense = user.license_hospital_level || 1;

            if (userLicense < requiredLicense) return res.json({ success: false, message: `Yetersiz Lisans! Seviye ${requiredLicense} Hastane Lisansı gerekli.` });
            if (user.money < costMoney) return res.json({ success: false, message: `Yetersiz Para. Gerekli: ${costMoney}` });
            if (user.gold < costGold) return res.json({ success: false, message: `Yetersiz Altın. Gerekli: ${costGold}` });

            db.beginTransaction(err => {
                if (err) return res.status(500).json({ success: false, message: 'Tx Error' });

                const deductResources = 'UPDATE users SET money = money - ?, gold = gold - ? WHERE id = ?';
                db.query(deductResources, [costMoney, costGold, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Kaynak düşülemedi.' }));

                    const duration = 10; // 10 seconds for demo
                    const endTime = new Date(Date.now() + duration * 1000);
                    
                    const startUpgrade = 'UPDATE hospitals SET upgrade_end_time = ? WHERE id = ?';
                    db.query(startUpgrade, [endTime, hospitalId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Geliştirme başlatılamadı.' }));

                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                            res.json({ success: true, message: 'Geliştirme başladı!', duration: duration });
                        });
                    });
                });
            });
        });
    });
});

// Complete Hospital Upgrade
app.post('/api/hospital/upgrade/complete', (req, res) => {
    const { userId, hospitalId } = req.body;

    const hospQuery = 'SELECT * FROM hospitals WHERE id = ?';
    db.query(hospQuery, [hospitalId], (err, hospRes) => {
        if (err || hospRes.length === 0) return res.status(404).json({ success: false, message: 'Hastane bulunamadı.' });
        
        const hospital = hospRes[0];
        if (!hospital.upgrade_end_time) return res.json({ success: false, message: 'Aktif geliştirme yok.' });
        
        const now = new Date();
        const endTime = new Date(hospital.upgrade_end_time);

        if (now < endTime) return res.json({ success: false, message: 'Geliştirme henüz bitmedi.' });

        const updateHosp = 'UPDATE hospitals SET level = level + 1, capacity = capacity + 5, upgrade_end_time = NULL WHERE id = ?';
        db.query(updateHosp, [hospitalId], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Güncelleme hatası.' });
            res.json({ success: true, message: `Tebrikler! Hastaneniz Seviye ${hospital.level + 1} oldu.` });
        });
    });
});

// Get My Hospital Details
app.get('/api/hospital/my', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

    const query = 'SELECT * FROM hospitals WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        if (results.length === 0) return res.json({ success: false, message: 'Hastaneniz yok.' });
        res.json({ success: true, hospital: results[0] });
    });
});

// Withdraw Money from Hospital Vault
app.post('/api/hospital/withdraw', (req, res) => {
    const { userId, amount } = req.body;
    
    if (!amount || amount <= 0) return res.json({ success: false, message: 'Geçersiz miktar.' });

    const hospQuery = 'SELECT * FROM hospitals WHERE user_id = ?';
    db.query(hospQuery, [userId], (err, hospRes) => {
        if (err || hospRes.length === 0) return res.status(404).json({ success: false, message: 'Hastane bulunamadı.' });
        
        const hospital = hospRes[0];
        if (hospital.balance < amount) return res.json({ success: false, message: 'Kasada yeterli para yok.' });

        db.beginTransaction(err => {
            if (err) return res.status(500).json({ success: false, message: 'Tx Error' });

            const updateHosp = 'UPDATE hospitals SET balance = balance - ? WHERE id = ?';
            db.query(updateHosp, [amount, hospital.id], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Hastane bakiyesi güncellenemedi.' }));

                const updateUser = 'UPDATE users SET money = money + ? WHERE id = ?';
                db.query(updateUser, [amount, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Kullanıcı bakiyesi güncellenemedi.' }));

                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                        res.json({ success: true, message: 'Para çekildi!', newBalance: hospital.balance - amount });
                    });
                });
            });
        });
    });
});

// Update Hospital Settings (Name, Price)
app.post('/api/hospital/update', (req, res) => {
    const { userId, name, price } = req.body;

    if (!name || price < 0) return res.json({ success: false, message: 'Geçersiz bilgiler.' });

    const checkQuery = 'SELECT id FROM hospitals WHERE user_id = ?';
    db.query(checkQuery, [userId], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ success: false, message: 'Hastane bulunamadı.' });

        const updateQuery = 'UPDATE hospitals SET name = ?, treatment_price = ? WHERE user_id = ?';
        db.query(updateQuery, [name, price, userId], (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Güncelleme hatası.' });
            res.json({ success: true, message: 'Hastane bilgileri güncellendi.' });
        });
    });
});

// --- BANKING SYSTEM ENDPOINTS ---

// Get All Banks
app.get('/api/banks', (req, res) => {
    const query = `
        SELECT b.*, u.username as owner_name 
        FROM banks b 
        JOIN users u ON b.owner_id = u.id 
        ORDER BY b.balance DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Get My Bank
app.get('/api/banks/my/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = 'SELECT * FROM banks WHERE owner_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'DB Error' });
        if (results.length === 0) return res.json({ success: true, hasBank: false });
        res.json({ success: true, hasBank: true, bank: results[0] });
    });
});

// Create Bank
app.post('/api/banks/create', (req, res) => {
    const { userId, name } = req.body;
    const COST = 100000; // 100k to create bank

    if (!name) return res.json({ success: false, message: 'Banka adı gerekli.' });

    // Check if user already has a bank
    db.query('SELECT id FROM banks WHERE owner_id = ?', [userId], (err, resBank) => {
        if (resBank.length > 0) return res.json({ success: false, message: 'Zaten bir bankanız var.' });

        // Check Money
        db.query('SELECT money FROM users WHERE id = ?', [userId], (err, resUser) => {
            if (resUser[0].money < COST) return res.json({ success: false, message: 'Yetersiz bakiye. 100.000 TL gerekli.' });

            db.beginTransaction(err => {
                if (err) return res.status(500).json({ success: false });

                db.query('UPDATE users SET money = money - ? WHERE id = ?', [COST, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false }));

                    db.query('INSERT INTO banks (owner_id, name) VALUES (?, ?)', [userId, name], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false }));
                        
                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false }));
                            res.json({ success: true, message: 'Banka kuruldu!' });
                        });
                    });
                });
            });
        });
    });
});

// Update Bank Settings
app.post('/api/banks/update', (req, res) => {
    const { userId, name, interestRate, loanRate, transferFee } = req.body;
    
    const query = 'UPDATE banks SET name = ?, interest_rate = ?, loan_rate = ?, transfer_fee = ? WHERE owner_id = ?';
    db.query(query, [name, interestRate, loanRate, transferFee, userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Güncelleme hatası.' });
        if (result.affectedRows === 0) return res.json({ success: false, message: 'Banka bulunamadı.' });
        res.json({ success: true, message: 'Ayarlar güncellendi.' });
    });
});

// Withdraw from Bank Vault
app.post('/api/banks/withdraw', (req, res) => {
    const { userId, amount } = req.body;
    if (amount <= 0) return res.json({ success: false, message: 'Geçersiz miktar.' });

    db.query('SELECT * FROM banks WHERE owner_id = ?', [userId], (err, resBank) => {
        if (resBank.length === 0) return res.json({ success: false, message: 'Banka bulunamadı.' });
        const bank = resBank[0];

        if (bank.balance < amount) return res.json({ success: false, message: 'Kasa bakiyesi yetersiz.' });

        db.beginTransaction(err => {
            db.query('UPDATE banks SET balance = balance - ? WHERE id = ?', [amount, bank.id], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false }));
                
                db.query('UPDATE users SET money = money + ? WHERE id = ?', [amount, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false }));
                    
                    db.commit(err => {
                        res.json({ success: true, message: 'Para çekildi.', newBalance: bank.balance - amount });
                    });
                });
            });
        });
    });
});

// Get Bank Stats (Total Deposits, Loans)
app.get('/api/banks/stats/:bankId', (req, res) => {
    const bankId = req.params.bankId;
    const q1 = 'SELECT SUM(balance) as total_deposits, SUM(loan_debt) as total_loans FROM bank_accounts WHERE bank_id = ?';
    db.query(q1, [bankId], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, stats: results[0] });
    });
});

// --- BANK ACCOUNT OPERATIONS ---

// Open Account / Get Account
app.post('/api/bank-accounts/open', (req, res) => {
    const { userId, bankId } = req.body;
    
    const query = 'INSERT IGNORE INTO bank_accounts (bank_id, user_id) VALUES (?, ?)';
    db.query(query, [bankId, userId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Hesap oluşturma hatası.' });
        res.json({ success: true, message: 'Hesap hazır.' });
    });
});

// Get Account Details
app.get('/api/bank-accounts/:userId/:bankId', (req, res) => {
    const { userId, bankId } = req.params;
    
    const query = `
        SELECT ba.*, b.name as bank_name, b.interest_rate, b.loan_rate, b.transfer_fee 
        FROM bank_accounts ba 
        JOIN banks b ON ba.bank_id = b.id 
        WHERE ba.user_id = ? AND ba.bank_id = ?
    `;
    db.query(query, [userId, bankId], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length === 0) return res.json({ success: false, message: 'Hesap bulunamadı.' });
        res.json({ success: true, account: results[0] });
    });
});

// Deposit Money
app.post('/api/bank-accounts/deposit', (req, res) => {
    const { userId, bankId, amount } = req.body;
    if (amount <= 0) return res.json({ success: false, message: 'Geçersiz miktar.' });

    db.query('SELECT money FROM users WHERE id = ?', [userId], (err, resUser) => {
        if (resUser[0].money < amount) return res.json({ success: false, message: 'Yetersiz nakit.' });

        db.beginTransaction(err => {
            db.query('UPDATE users SET money = money - ? WHERE id = ?', [amount, userId], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false }));
                
                db.query('UPDATE bank_accounts SET balance = balance + ? WHERE user_id = ? AND bank_id = ?', [amount, userId, bankId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false }));
                    
                    // Add to Bank Vault (Deposits increase bank liquidity)
                    db.query('UPDATE banks SET balance = balance + ? WHERE id = ?', [amount, bankId], (err) => {
                         if (err) return db.rollback(() => res.status(500).json({ success: false }));
                         
                         db.commit(err => {
                            res.json({ success: true, message: 'Para yatırıldı.' });
                         });
                    });
                });
            });
        });
    });
});

// Withdraw Money
app.post('/api/bank-accounts/withdraw', (req, res) => {
    const { userId, bankId, amount } = req.body;
    if (amount <= 0) return res.json({ success: false, message: 'Geçersiz miktar.' });

    db.query('SELECT balance FROM bank_accounts WHERE user_id = ? AND bank_id = ?', [userId, bankId], (err, resAcc) => {
        if (resAcc.length === 0 || resAcc[0].balance < amount) return res.json({ success: false, message: 'Yetersiz bakiye.' });

        // Check Bank Vault Liquidity
        db.query('SELECT balance FROM banks WHERE id = ?', [bankId], (err, resBank) => {
            if (resBank[0].balance < amount) return res.json({ success: false, message: 'Banka kasasında yeterli nakit yok.' });

            db.beginTransaction(err => {
                db.query('UPDATE bank_accounts SET balance = balance - ? WHERE user_id = ? AND bank_id = ?', [amount, userId, bankId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false }));
                    
                    db.query('UPDATE users SET money = money + ? WHERE id = ?', [amount, userId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false }));
                        
                        db.query('UPDATE banks SET balance = balance - ? WHERE id = ?', [amount, bankId], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false }));
                            
                            db.commit(err => {
                                res.json({ success: true, message: 'Para çekildi.' });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Take Loan
app.post('/api/bank-accounts/loan', (req, res) => {
    const { userId, bankId, amount } = req.body;
    if (amount <= 0) return res.json({ success: false, message: 'Geçersiz miktar.' });

    db.query('SELECT * FROM banks WHERE id = ?', [bankId], (err, resBank) => {
        const bank = resBank[0];
        if (bank.balance < amount) return res.json({ success: false, message: 'Banka bu krediyi veremez (Yetersiz Kasa).' });

        const interest = (amount * bank.loan_rate) / 100;
        const totalDebt = parseInt(amount) + parseInt(interest);

        db.beginTransaction(err => {
            // Give money to user
            db.query('UPDATE users SET money = money + ? WHERE id = ?', [amount, userId], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false }));
                
                // Add debt to account
                db.query('UPDATE bank_accounts SET loan_debt = loan_debt + ? WHERE user_id = ? AND bank_id = ?', [totalDebt, userId, bankId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false }));
                    
                    // Deduct from Bank Vault
                    db.query('UPDATE banks SET balance = balance - ? WHERE id = ?', [amount, bankId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false }));
                        
                        db.commit(err => {
                            res.json({ success: true, message: `Kredi alındı. Geri ödeme: ${totalDebt} TL` });
                        });
                    });
                });
            });
        });
    });
});

// Pay Loan
app.post('/api/bank-accounts/pay-loan', (req, res) => {
    const { userId, bankId, amount } = req.body;
    if (amount <= 0) return res.json({ success: false, message: 'Geçersiz miktar.' });

    db.query('SELECT loan_debt FROM bank_accounts WHERE user_id = ? AND bank_id = ?', [userId, bankId], (err, resAcc) => {
        if (resAcc[0].loan_debt < amount) return res.json({ success: false, message: 'Borçtan fazla ödeme yapılamaz.' });

        db.query('SELECT money FROM users WHERE id = ?', [userId], (err, resUser) => {
            if (resUser[0].money < amount) return res.json({ success: false, message: 'Yetersiz nakit.' });

            db.beginTransaction(err => {
                db.query('UPDATE users SET money = money - ? WHERE id = ?', [amount, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false }));
                    
                    db.query('UPDATE bank_accounts SET loan_debt = loan_debt - ? WHERE user_id = ? AND bank_id = ?', [amount, userId, bankId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false }));
                        
                        // Add to Bank Vault (Profit)
                        db.query('UPDATE banks SET balance = balance + ? WHERE id = ?', [amount, bankId], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false }));
                            
                            db.commit(err => {
                                res.json({ success: true, message: 'Borç ödendi.' });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Transfer Money
app.post('/api/bank-accounts/transfer', (req, res) => {
    const { userId, bankId, targetUsername, amount } = req.body;
    if (amount <= 0) return res.json({ success: false, message: 'Geçersiz miktar.' });

    // 1. Find Target User
    db.query('SELECT id FROM users WHERE username = ?', [targetUsername], (err, resTarget) => {
        if (resTarget.length === 0) return res.json({ success: false, message: 'Kullanıcı bulunamadı.' });
        const targetId = resTarget[0].id;

        // 2. Get Sender Account & Bank Info
        const q = `SELECT ba.balance, b.transfer_fee FROM bank_accounts ba JOIN banks b ON ba.bank_id = b.id WHERE ba.user_id = ? AND ba.bank_id = ?`;
        db.query(q, [userId, bankId], (err, resSender) => {
            if (resSender.length === 0) return res.json({ success: false, message: 'Hesap hatası.' });
            
            const sender = resSender[0];
            const fee = Math.floor((amount * sender.transfer_fee) / 100);
            const totalDeduct = parseInt(amount) + fee;

            if (sender.balance < totalDeduct) return res.json({ success: false, message: `Yetersiz bakiye. İşlem ücreti: ${fee} TL` });

            // 3. Check Target Account (Create if not exists? No, must have account in same bank for simplicity or cross-bank?)
            // For simplicity: Target must have account in THIS bank.
            db.query('SELECT id FROM bank_accounts WHERE user_id = ? AND bank_id = ?', [targetId, bankId], (err, resTargetAcc) => {
                if (resTargetAcc.length === 0) return res.json({ success: false, message: 'Alıcının bu bankada hesabı yok.' });

                db.beginTransaction(err => {
                    // Deduct from Sender
                    db.query('UPDATE bank_accounts SET balance = balance - ? WHERE user_id = ? AND bank_id = ?', [totalDeduct, userId, bankId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false }));
                        
                        // Add to Target
                        db.query('UPDATE bank_accounts SET balance = balance + ? WHERE user_id = ? AND bank_id = ?', [amount, targetId, bankId], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false }));
                            
                            // Add Fee to Bank Vault
                            db.query('UPDATE banks SET balance = balance + ? WHERE id = ?', [fee, bankId], (err) => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false }));
                                
                                db.commit(err => {
                                    res.json({ success: true, message: 'Transfer başarılı.' });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
