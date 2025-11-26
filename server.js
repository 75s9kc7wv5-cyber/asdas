const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to database: simworld');
    }
});

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

// Root Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) return res.status(500).json({ message: 'Veritabanı hatası' });
        if (results.length > 0) {
            res.json({ user: results[0] });
        } else {
            res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı' });
        }
    });
});

// Register Endpoint
app.post('/api/register', (req, res) => {
    const { username, password, email } = req.body;
    const query = 'INSERT INTO users (username, password, email, money, energy, health) VALUES (?, ?, ?, 1000, 100, 100)';
    db.query(query, [username, password, email], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Kullanıcı adı veya e-posta zaten kullanımda.' });
            }
            return res.status(500).json({ message: 'Kayıt hatası.' });
        }
        res.json({ success: true, message: 'Kayıt başarılı!' });
    });
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
    const userQuery = 'SELECT energy, health, xp, level FROM users WHERE id = ?';
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

            // XP & Level Logic
            const xpGain = 2; // 2 XP per mining attempt
            let currentLevel = user.level || 1;
            let currentXp = (user.xp || 0) + xpGain;
            let requiredXp = currentLevel * 100;
            let leveledUp = false;

            while (currentXp >= requiredXp) {
                currentXp -= requiredXp;
                currentLevel++;
                requiredXp = currentLevel * 100;
                leveledUp = true;
            }

            // Transaction Başlat
            db.beginTransaction(err => {
                if (err) return res.status(500).json({ success: false, message: 'Transaction Error' });

                // 1. Kullanıcıdan Enerji/Sağlık Düş, XP/Level Ekle
                db.query('UPDATE users SET energy = energy - ?, health = health - ?, xp = ?, level = ? WHERE id = ?', 
                    [consumption, consumption, currentXp, currentLevel, userId], (err) => {
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

                // Check License Level - REMOVED as per request
                // const licenseQuery = 'SELECT level FROM licenses WHERE user_id = ? AND mine_type = ?';
                // db.query(licenseQuery, [userId, mineType], (err, licenseRes) => {
                    // if (err) return res.status(500).json({ success: false, message: 'License DB Error' });
                    
                    // const licenseLevel = licenseRes.length > 0 ? licenseRes[0].level : 0;
                    
                    // if (licenseLevel < targetLevel) {
                    //     return res.json({ success: false, message: `Yetersiz Lisans! Bu madeni geliştirmek için ${targetLevel}. seviye lisans gerekiyor.` });
                    // }

                    // Cost Calculation
                    const costMoney = Math.floor(5000 * Math.pow(1.8, currentLevel - 1));
                    const costGold = 50 * currentLevel;
                    const costDiamond = currentLevel >= 5 ? (currentLevel - 4) * 2 : 0; // Example: Level 5 needs 2 diamonds, Level 6 needs 4...
                    
                    if (user.money < costMoney || user.gold < costGold || (user.diamond || 0) < costDiamond) {
                        return res.json({ success: false, message: 'Yetersiz kaynak.' });
                    }
                    
                    // Duration Calculation
                    const durationSeconds = currentLevel * 60;
                    // Use MySQL NOW() for consistency if possible, but here we use timestamp for JS compatibility in this file
                    // To be safe and consistent with the "server-side timer" request, let's stick to Date.now() which IS server time.
                    const endTime = Date.now() + (durationSeconds * 1000);
                    
                    // 3. Deduct Resources & Start Research
                    db.beginTransaction(err => {
                        if (err) return res.status(500).json({ success: false, message: 'Transaction Error' });
                        
                        db.query('UPDATE users SET money = money - ?, gold = gold - ?, diamond = diamond - ? WHERE id = ?', [costMoney, costGold, costDiamond, userId], (err) => {
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
                                    
                                    // Return new balances for UI update
                                    const newMoney = user.money - costMoney;
                                    const newGold = user.gold - costGold;
                                    const newDiamond = (user.diamond || 0) - costDiamond;
                                    
                                    res.json({ success: true, endTime: endTime, newMoney, newGold, newDiamond });
                                });
                            });
                        });
                    });
                // }); // End License Query
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

    // Check for finished treatments
    const checkTreatmentQuery = 'SELECT * FROM hospital_active_treatments WHERE user_id = ? AND end_time <= NOW()';
    db.query(checkTreatmentQuery, [userId], (err, finishedTreatments) => {
        if (!err && finishedTreatments.length > 0) {
            const treatment = finishedTreatments[0];
            // Heal User
            db.query('UPDATE users SET health = 100 WHERE id = ?', [userId], (err) => {
                if (!err) {
                    // Remove from active treatments
                    db.query('DELETE FROM hospital_active_treatments WHERE id = ?', [treatment.id]);
                }
            });
        }

        const query = 'SELECT money, gold, diamond, health, energy, level, license_hospital_level FROM users WHERE id = ?';
        db.query(query, [userId], (err, results) => {
            if (err) return res.status(500).json({ error: err });
            if (results.length === 0) return res.status(404).json({ error: 'User not found' });
            res.json(results[0]);
        });
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

// --- BANK MANAGEMENT ENDPOINTS ---

// Get All Banks (City Banks)
app.get('/api/banks', (req, res) => {
    const userId = req.query.userId || 0;
    const query = `
        SELECT b.*, u.username as owner_name,
        (SELECT COUNT(*) FROM bank_accounts ba WHERE ba.bank_id = b.id AND ba.user_id = ?) as has_account
        FROM banks b
        JOIN users u ON b.owner_id = u.id
        ORDER BY COALESCE(b.balance, 0) DESC, b.id ASC
    `;
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Get My Bank
app.get('/api/banks/my/:userId', (req, res) => {
    const { userId } = req.params;
    const query = 'SELECT * FROM banks WHERE owner_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        if (results.length > 0) {
            res.json({ success: true, hasBank: true, bank: results[0] });
        } else {
            res.json({ success: true, hasBank: false });
        }
    });
});

// Create Bank
app.post('/api/banks/create', (req, res) => {
    const { userId, name } = req.body;
    const COST = 100000;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // Check User Money
        db.query('SELECT money FROM users WHERE id = ?', [userId], (err, users) => {
            if (err || users.length === 0) return db.rollback(() => res.status(500).json({ success: false, message: 'User not found' }));
            
            const user = users[0];
            if (user.money < COST) {
                return db.rollback(() => res.json({ success: false, message: 'Yetersiz bakiye.' }));
            }

            // Check if user already has a bank
            db.query('SELECT id FROM banks WHERE owner_id = ?', [userId], (err, banks) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'DB Error' }));
                if (banks.length > 0) {
                    return db.rollback(() => res.json({ success: false, message: 'Zaten bir bankanız var.' }));
                }

                // Deduct Money
                db.query('UPDATE users SET money = money - ? WHERE id = ?', [COST, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Money update error' }));

                    // Create Bank
                    const insertQuery = `
                        INSERT INTO banks (owner_id, name, balance, interest_rate, loan_rate, transfer_fee, account_opening_fee) 
                        VALUES (?, ?, 0, 5, 15, 2, 100)
                    `;
                    db.query(insertQuery, [userId, name], (err, result) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Bank creation error' }));

                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                            res.json({ success: true, message: 'Banka başarıyla kuruldu!' });
                        });
                    });
                });
            });
        });
    });
});

// Open Bank Account
app.post('/api/bank-accounts/open', (req, res) => {
    const { userId, bankId } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // Get Bank Info (Fee)
        db.query('SELECT account_opening_fee FROM banks WHERE id = ?', [bankId], (err, banks) => {
            if (err || banks.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Banka bulunamadı' }));
            
            const fee = banks[0].account_opening_fee;

            // Check User Money
            db.query('SELECT money FROM users WHERE id = ?', [userId], (err, users) => {
                if (err || users.length === 0) return db.rollback(() => res.status(500).json({ success: false, message: 'User error' }));
                
                const user = users[0];
                if (user.money < fee) {
                    return db.rollback(() => res.json({ success: false, message: 'Yetersiz bakiye.' }));
                }

                // Deduct Fee & Add to Bank
                db.query('UPDATE users SET money = money - ? WHERE id = ?', [fee, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'User update error' }));

                    db.query('UPDATE banks SET balance = balance + ? WHERE id = ?', [fee, bankId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Bank update error' }));

                        // Create Account
                        // Generate IBAN (6 Digits for varchar(6))
                        const generateIBAN = () => Math.floor(100000 + Math.random() * 900000).toString();
                        
                        // Retry loop for IBAN uniqueness is better, but for simplicity:
                        const createAccount = (retryCount = 0) => {
                            if (retryCount > 3) return db.rollback(() => res.status(500).json({ success: false, message: 'IBAN generation failed' }));
                            
                            const iban = generateIBAN();
                            const query = 'INSERT INTO bank_accounts (bank_id, user_id, iban, created_at) VALUES (?, ?, ?, NOW())';
                            
                            db.query(query, [bankId, userId, iban], (err, result) => {
                                if (err) {
                                    console.error("Account Creation Error:", err); // Log the error
                                    // Check duplicate IBAN
                                    if (err.code === 'ER_DUP_ENTRY') return createAccount(retryCount + 1);
                                    return db.rollback(() => res.status(500).json({ success: false, message: 'Account creation error', error: err.message }));
                                }
                                
                                const newAccountId = result.insertId;

                                // Log Transaction
                                db.query('INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)', 
                                    [userId, bankId, newAccountId, 'account_opening', fee, 'Hesap Açılışı'], (err) => {
                                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Log error' }));

                                        db.commit(err => {
                                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                                            res.json({ success: true, message: 'Hesap oluşturuldu.', iban: iban });
                                        });
                                    });
                            });
                        };
                        createAccount();
                    });
                });
            });
        });
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
        if (err) return res.status(500).json({ success: false, error: err });
        if (results.length > 0) {
            res.json({ success: true, account: results[0] });
        } else {
            res.json({ success: false, message: 'Hesap bulunamadı.' });
        }
    });
});

// Get Account Logs
app.get('/api/bank-accounts/logs/:userId/:bankId', (req, res) => {
    const { userId, bankId } = req.params;
    
    // First find the active account ID
    db.query('SELECT id FROM bank_accounts WHERE user_id = ? AND bank_id = ?', [userId, bankId], (err, accounts) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        if (accounts.length === 0) {
            // No active account, return empty logs
            return res.json({ success: true, logs: [] });
        }

        const accountId = accounts[0].id;
        const query = `
            SELECT * FROM bank_transactions 
            WHERE bank_account_id = ? 
            ORDER BY created_at DESC LIMIT 50
        `;
        db.query(query, [accountId], (err, results) => {
            if (err) {
                console.error('Logs Error:', err);
                return res.status(500).json({ success: false, error: err.message || err });
            }
            res.json({ success: true, logs: results });
        });
    });
});

// Close Bank Account
app.post('/api/bank-accounts/close', (req, res) => {
    const { userId, bankId } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // 1. Get Bank Fee & Account Info
        const infoQuery = `
            SELECT ba.id, b.closing_fee, ba.loan_debt, ba.balance, u.money as user_money, u.username
            FROM bank_accounts ba
            JOIN banks b ON ba.bank_id = b.id
            JOIN users u ON ba.user_id = u.id
            WHERE ba.user_id = ? AND ba.bank_id = ?
        `;
        
        db.query(infoQuery, [userId, bankId], (err, results) => {
            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'DB Error' }));
            if (results.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Hesap bulunamadı.' }));

            const { id: accountId, closing_fee, loan_debt, balance, user_money, username } = results[0];
            const fee = closing_fee || 5000;

            // 2. Check Debt
            if (loan_debt > 0) {
                // Penalty for attempting to close with debt
                const scoreDec = (Math.random() * 3.0) + 2.0; // 2.0 - 5.0
                db.query('UPDATE bank_accounts SET credit_score = GREATEST(0, credit_score - ?) WHERE user_id = ? AND bank_id = ?', [scoreDec, userId, bankId], (err) => {
                    if (err) console.error('Credit Score Penalty Error', err);
                    
                    db.query('INSERT INTO bank_transactions (user_id, bank_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?)', 
                        [userId, bankId, 'score_update', 0, `Kredi Puanı Güncellendi (-${scoreDec.toFixed(2)}) - Borçlu Kapatma Girişimi`], (err) => {
                            db.commit(err => { // Commit the penalty even if we fail the close
                                return res.status(400).json({ success: false, message: 'Bu banka hesabını kapatamazsınız, aktif kredi borcunuz bulunuyor! (Kredi Puanı Düşürüldü)' });
                            });
                        });
                });
                return; // Stop here, but we committed the penalty in a separate flow? 
                // Wait, we are in a transaction. If we commit, we commit everything. 
                // But we haven't done anything else yet. So committing here just saves the penalty. Correct.
            }

            // 2.1 Check Active Deposits
            const depositQuery = 'SELECT COUNT(*) as count FROM bank_deposits WHERE user_id = ? AND bank_id = ? AND status = "active"';
            db.query(depositQuery, [userId, bankId], (err, depResults) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Deposit check error' }));
                
                if (depResults[0].count > 0) {
                    return db.rollback(() => res.status(400).json({ success: false, message: 'Bu banka hesabını kapatamazsınız, aktif mevduat hesabınız bulunuyor!' }));
                }

                // 3. Check if user can afford fee (Balance + Pocket Money >= Fee)
                const totalAssets = user_money + balance;
                if (totalAssets < fee) {
                    return db.rollback(() => res.status(400).json({ success: false, message: 'Hesap kapatma ücretini ödeyecek bakiyeniz yok.' }));
                }

                // 4. Calculate Net Change
                // User gets balance, pays fee. Net = balance - fee.
                const netChange = balance - fee;

                // 5. Update User Money
                db.query('UPDATE users SET money = money + ? WHERE id = ?', [netChange, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'User update error' }));

                    // 6. Update Bank Balance (Add Fee)
                    db.query('UPDATE banks SET balance = balance + ? WHERE id = ?', [fee, bankId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Bank update error' }));

                        // 7. Delete Account
                        db.query('DELETE FROM bank_accounts WHERE user_id = ? AND bank_id = ?', [userId, bankId], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Delete error' }));

                            // 8. Log Transaction
                            const logDesc = `Hesap Kapatma (Ücret: ${fee} TL) 🏦❌`;
                            const logQuery = 'INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)';
                            
                            db.query(logQuery, [userId, bankId, accountId, 'account_closure', fee, logDesc], (err) => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Log error' }));

                                db.commit(err => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                                    res.json({ success: true, message: 'Banka hesabınız başarıyla kapatıldı.' });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Deposit Money
app.post('/api/bank-accounts/deposit', (req, res) => {
    const { userId, bankId, amount } = req.body;
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Geçersiz miktar.' });

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // Check Account Existence
        db.query('SELECT id FROM bank_accounts WHERE user_id = ? AND bank_id = ?', [userId, bankId], (err, accounts) => {
            if (err || accounts.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Hesap bulunamadı.' }));
            const accountId = accounts[0].id;

            // Check User Money
            db.query('SELECT money FROM users WHERE id = ?', [userId], (err, users) => {
                if (err || users.length === 0) return db.rollback(() => res.status(500).json({ success: false, message: 'User error' }));
                if (users[0].money < amount) return db.rollback(() => res.json({ success: false, message: 'Yetersiz nakit.' }));

                // Deduct from User
                db.query('UPDATE users SET money = money - ? WHERE id = ?', [amount, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'User update error' }));

                    // Add to Bank Account
                    db.query('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?', [amount, accountId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Account update error' }));

                        // Log & Score Update
                        let scoreInc = 0;
                        if (amount >= 10000) {
                            scoreInc = Math.min(0.5, (amount / 100000) * 0.5);
                        }

                        const updateScoreQuery = scoreInc > 0 
                            ? 'UPDATE bank_accounts SET credit_score = LEAST(100, credit_score + ?) WHERE id = ?'
                            : 'SELECT 1'; // No-op
                        
                        const updateParams = scoreInc > 0 ? [scoreInc, accountId] : [];

                        db.query(updateScoreQuery, updateParams, (err) => {
                            if (err) console.error('Credit Score Update Error', err);
                            
                            db.query('INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)', 
                                [userId, bankId, accountId, 'deposit', amount, 'Para Yatırma'], (err) => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Log error' }));
                                    
                                    const finish = () => {
                                        db.commit(err => {
                                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                                            res.json({ success: true, message: 'Para yatırıldı.' });
                                        });
                                    };

                                    if (scoreInc > 0) {
                                        db.query('INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)', 
                                            [userId, bankId, accountId, 'score_update', 0, `Kredi Puanı Güncellendi (+${scoreInc.toFixed(4)})`], (err) => {
                                                finish();
                                            });
                                    } else {
                                        finish();
                                    }
                                });
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
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Geçersiz miktar.' });

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // Check Account Balance
        db.query('SELECT id, balance FROM bank_accounts WHERE user_id = ? AND bank_id = ?', [userId, bankId], (err, accounts) => {
            if (err || accounts.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Hesap bulunamadı.' }));
            const accountId = accounts[0].id;
            if (accounts[0].balance < amount) return db.rollback(() => res.json({ success: false, message: 'Yetersiz bakiye.' }));

            // Deduct from Account
            db.query('UPDATE bank_accounts SET balance = balance - ? WHERE id = ?', [amount, accountId], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Account update error' }));

                // Add to User
                db.query('UPDATE users SET money = money + ? WHERE id = ?', [amount, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'User update error' }));

                    // Log
                    db.query('INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)', 
                        [userId, bankId, accountId, 'withdraw', amount, 'Para Çekme'], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Log error' }));
                            
                            db.commit(err => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                                res.json({ success: true, message: 'Para çekildi.' });
                            });
                        });
                });
            });
        });
    });
});

// Transfer Money
app.post('/api/bank-accounts/transfer', (req, res) => {
    const { userId, bankId, amount, targetIban } = req.body;
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Geçersiz miktar.' });

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // Get Sender Account & Bank Fee
        const senderQuery = `
            SELECT ba.id, ba.balance, b.transfer_fee 
            FROM bank_accounts ba 
            JOIN banks b ON ba.bank_id = b.id 
            WHERE ba.user_id = ? AND ba.bank_id = ?
        `;
        db.query(senderQuery, [userId, bankId], (err, senders) => {
            if (err || senders.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Gönderen hesap bulunamadı.' }));
            
            const sender = senders[0];
            const senderAccountId = sender.id;
            const feeRate = sender.transfer_fee;
            const fee = Math.ceil(amount * (feeRate / 100));
            const totalDeduct = amount + fee;

            if (sender.balance < totalDeduct) return db.rollback(() => res.json({ success: false, message: 'Yetersiz bakiye (Transfer + Ücret).' }));

            // Find Target Account
            db.query('SELECT id, user_id, bank_id FROM bank_accounts WHERE iban = ?', [targetIban], (err, targets) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Target search error' }));
                if (targets.length === 0) return db.rollback(() => res.json({ success: false, message: 'Alıcı IBAN bulunamadı.' }));

                const target = targets[0];
                const targetAccountId = target.id;

                // Deduct from Sender
                db.query('UPDATE bank_accounts SET balance = balance - ? WHERE id = ?', [totalDeduct, senderAccountId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Sender update error' }));

                    // Add to Target
                    db.query('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?', [amount, targetAccountId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Target update error' }));

                        // Add Fee to Bank
                        db.query('UPDATE banks SET balance = balance + ? WHERE id = ?', [fee, bankId], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Bank fee update error' }));

                            // Logs
                            const logSender = 'INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)';
                            const logTarget = 'INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)';

                            db.query(logSender, [userId, bankId, senderAccountId, 'transfer_out', totalDeduct, `Transfer: ${targetIban}`], (err) => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Log sender error' }));
                                
                                db.query(logTarget, [target.user_id, target.bank_id, targetAccountId, 'transfer_in', amount, `Gelen Transfer`], (err) => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Log target error' }));

                                    db.commit(err => {
                                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
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
});

// Check Active Loan
app.get('/api/bank-accounts/has-loan/:userId', (req, res) => {
    const { userId } = req.params;
    // Check if user has ANY loan debt > 0 in ANY bank account
    db.query('SELECT COUNT(*) as count FROM bank_accounts WHERE user_id = ? AND loan_debt > 0', [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, hasLoan: results[0].count > 0 });
    });
});

// Take Loan
app.post('/api/bank-accounts/loan', (req, res) => {
    const { userId, bankId, amount } = req.body;
    
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // Check existing loan & Credit Score
        db.query('SELECT id, loan_debt, credit_score FROM bank_accounts WHERE user_id = ? AND bank_id = ?', [userId, bankId], (err, accounts) => {
            if (err || accounts.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Hesap bulunamadı.' }));
            
            const acc = accounts[0];
            const accountId = acc.id;
            if (acc.loan_debt > 0) return db.rollback(() => res.json({ success: false, message: 'Zaten ödenmemiş krediniz var.' }));

            // Credit Score Validation
            let requiredScore = 0;
            if (amount >= 500000) requiredScore = 90;
            else if (amount >= 250000) requiredScore = 50;
            else if (amount >= 100000) requiredScore = 30;
            else if (amount >= 50000) requiredScore = 20; // Keep 50k as 20
            else if (amount >= 30000) requiredScore = 0; // 30k is free

            if ((acc.credit_score || 0) < requiredScore) {
                // Log Failure
                db.query('INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)', 
                    [userId, bankId, accountId, 'loan_rejected', 0, `Kredi Başvurusu Reddedildi (Yetersiz Puan: ${acc.credit_score}/${requiredScore})`], (err) => {
                        db.commit(err => {
                            return res.status(400).json({ success: false, message: `Kredi Puanı Yetersiz! (Gereken: ${requiredScore}, Mevcut: ${parseFloat(acc.credit_score).toFixed(2)})` });
                        });
                    });
                return;
            }

            // Get Bank Rate
            db.query('SELECT loan_rate FROM banks WHERE id = ?', [bankId], (err, banks) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Bank error' }));
                
                const rate = banks[0].loan_rate;
                const interest = Math.floor(amount * (rate / 100));
                const totalDebt = amount + interest;

                // Update Account (Add Balance, Set Debt, Set Loan Taken Time)
                db.query('UPDATE bank_accounts SET balance = balance + ?, loan_debt = ?, loan_taken_at = NOW() WHERE id = ?', 
                    [amount, totalDebt, accountId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Account update error' }));

                        // Log (No Score Increase on Take)
                        db.query('INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)', 
                            [userId, bankId, accountId, 'loan_taken', amount, 'Kredi Verildi'], (err) => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Log error' }));

                                db.commit(err => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                                    res.json({ success: true, message: 'Kredi başvurusu onaylandı ve hesabınıza yattı.' });
                                });
                            });
                    });
            });
        });
    });
});

// Pay Loan
app.post('/api/bank-accounts/pay-loan', (req, res) => {
    const { userId, bankId, amount } = req.body; // Amount is what user pays

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        db.query('SELECT id, balance, loan_debt, loan_taken_at, last_loan_score_update_at FROM bank_accounts WHERE user_id = ? AND bank_id = ?', [userId, bankId], (err, accounts) => {
            if (err || accounts.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Hesap bulunamadı.' }));
            
            const acc = accounts[0];
            const accountId = acc.id;
            if (acc.loan_debt <= 0) return db.rollback(() => res.json({ success: false, message: 'Borcunuz yok.' }));
            
            // If amount > debt, just pay debt
            const payAmount = Math.min(amount, acc.loan_debt);
            
            if (acc.balance < payAmount) return db.rollback(() => res.json({ success: false, message: 'Hesap bakiyesi yetersiz.' }));

            // Update Account
            db.query('UPDATE bank_accounts SET balance = balance - ?, loan_debt = loan_debt - ? WHERE id = ?', 
                [payAmount, payAmount, accountId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Update error' }));

                    // Add Profit to Bank
                    db.query('UPDATE banks SET balance = balance + ? WHERE id = ?', [payAmount, bankId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Bank update error' }));

                        // Check if fully paid
                        const isFullyPaid = (acc.loan_debt - payAmount) <= 0;
                        let scoreInc = 0;
                        let scoreDesc = '';

                        if (isFullyPaid) {
                            const now = new Date();
                            const takenAt = new Date(acc.loan_taken_at);
                            const diffMs = now - takenAt;
                            const diffMins = diffMs / 60000;
                            const diffHours = diffMins / 60;

                            // Cooldown Check (24h)
                            const lastUpdate = acc.last_loan_score_update_at ? new Date(acc.last_loan_score_update_at) : new Date(0);
                            const cooldownMs = now - lastUpdate;
                            const cooldownHours = cooldownMs / (1000 * 60 * 60);

                            if (cooldownHours >= 24) {
                                if (diffMins < 1) {
                                    scoreInc = 0.1; // Very fast repayment
                                    scoreDesc = 'Anında Ödeme (+0.1)';
                                } else if (diffMins < 120) {
                                    scoreInc = 0.2;
                                    scoreDesc = 'Hızlı Ödeme (+0.2)';
                                } else if (diffHours < 24) {
                                    scoreInc = 0.5;
                                    scoreDesc = 'Zamanında Ödeme (+0.5)';
                                } else {
                                    scoreInc = 1.0;
                                    scoreDesc = 'Uzun Vadeli Ödeme (+1.0)';
                                }

                                // Scale by Loan Size (Approximate logic based on debt paid)
                                // If debt was small (<100k), maybe cap it? Prompt says:
                                // "küçük krediler (30k–100k) düşük etki, büyük krediler (250k–500k) yalnızca maksimum +1 sınırına kadar artış sağlayabilsin"
                                // My logic above gives max +1 anyway. Let's reduce for small loans.
                                if (payAmount < 100000) {
                                    scoreInc = Math.min(scoreInc, 0.3); // Cap small loans at 0.3
                                    if (scoreInc > 0) scoreDesc += ' (Küçük Kredi Limiti)';
                                }
                            } else {
                                scoreDesc = 'Cooldown (24s)';
                            }
                        }

                        const updateScoreQuery = scoreInc > 0 
                            ? 'UPDATE bank_accounts SET credit_score = LEAST(100, credit_score + ?), last_loan_score_update_at = NOW() WHERE id = ?'
                            : 'SELECT 1';
                        
                        const updateParams = scoreInc > 0 ? [scoreInc, accountId] : [];

                        db.query(updateScoreQuery, updateParams, (err) => {
                            if (err) console.error('Credit Score Update Error', err);

                            db.query('INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)', 
                                [userId, bankId, accountId, 'loan_paid', payAmount, 'Kredi Ödemesi'], (err) => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Log error' }));

                                    const finish = () => {
                                        db.commit(err => {
                                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                                            res.json({ success: true, message: 'Ödeme yapıldı.' });
                                        });
                                    };

                                    if (scoreInc > 0) {
                                        db.query('INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)', 
                                            [userId, bankId, accountId, 'score_update', 0, `Kredi Puanı Güncellendi (+${scoreInc.toFixed(2)}) - ${scoreDesc}`], (err) => {
                                                finish();
                                            });
                                    } else {
                                        finish();
                                    }
                                });
                        });
                    });
                });
        });
    });
});

// Create Deposit (Mevduat)
app.post('/api/bank-accounts/deposit-create', (req, res) => {
    const { userId, bankId, amount, durationMinutes } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // Check Balance
        db.query('SELECT id, balance FROM bank_accounts WHERE user_id = ? AND bank_id = ?', [userId, bankId], (err, accounts) => {
            if (err || accounts.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Hesap bulunamadı.' }));
            const accountId = accounts[0].id;
            if (accounts[0].balance < amount) return db.rollback(() => res.json({ success: false, message: 'Yetersiz bakiye.' }));

            // Get Interest Rate
            db.query('SELECT interest_rate FROM banks WHERE id = ?', [bankId], (err, banks) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Bank error' }));
                
                const rate = banks[0].interest_rate;
                // Interest = Amount * (Rate/100) * (Duration/60) (Hourly rate assumption)
                const interestAmount = Math.floor(amount * (rate / 100) * (durationMinutes / 60));
                
                const startTime = new Date();
                const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

                // Deduct Balance
                db.query('UPDATE bank_accounts SET balance = balance - ? WHERE id = ?', [amount, accountId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Balance update error' }));

                    // Create Deposit Record
                    const insertDep = `
                        INSERT INTO bank_deposits (user_id, bank_id, amount, interest_rate, interest_amount, start_time, end_time, status) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
                    `;
                    db.query(insertDep, [userId, bankId, amount, rate, interestAmount, startTime, endTime], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Deposit create error' }));

                        // Log & Score Update (Fixed +0.5)
                        const scoreInc = 0.5;
                        db.query('UPDATE bank_accounts SET credit_score = LEAST(100, credit_score + ?) WHERE id = ?', [scoreInc, accountId], (err) => {
                            if (err) console.error('Credit Score Update Error', err);

                            db.query('INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)', 
                                [userId, bankId, accountId, 'deposit_open', amount, 'Mevduat Açılışı'], (err) => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Log error' }));

                                    db.query('INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)', 
                                        [userId, bankId, accountId, 'score_update', 0, `Kredi Puanı Güncellendi (+${scoreInc.toFixed(2)})`], (err) => {
                                            db.commit(err => {
                                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                                                res.json({ success: true, message: 'Mevduat hesabı açıldı.' });
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

// Get Active Deposits
app.get('/api/bank-accounts/deposits/:userId/:bankId', (req, res) => {
    const { userId, bankId } = req.params;
    const query = 'SELECT * FROM bank_deposits WHERE user_id = ? AND bank_id = ? AND status = "active"';
    db.query(query, [userId, bankId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, deposits: results });
    });
});

// Break Deposit (Erken Bozma)
app.post('/api/bank-accounts/deposit-break', (req, res) => {
    const { userId, depositId } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        db.query('SELECT * FROM bank_deposits WHERE id = ? AND user_id = ? AND status = "active"', [depositId, userId], (err, deposits) => {
            if (err || deposits.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Mevduat bulunamadı.' }));
            
            const dep = deposits[0];
            const penalty = Math.floor(dep.amount * 0.03); // 3% Penalty
            const refund = dep.amount - penalty;

            // Find Account ID
            db.query('SELECT id FROM bank_accounts WHERE user_id = ? AND bank_id = ?', [userId, dep.bank_id], (err, accounts) => {
                if (err || accounts.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Hesap bulunamadı.' }));
                const accountId = accounts[0].id;

                // Update Deposit Status
                db.query('UPDATE bank_deposits SET status = "broken" WHERE id = ?', [depositId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Update status error' }));

                    // Refund to Account
                    db.query('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?', [refund, accountId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Refund error' }));

                        // Log
                        const scoreDec = (Math.random() * 2.0) + 1.0; // 1.0 - 3.0
                        db.query('UPDATE bank_accounts SET credit_score = GREATEST(0, credit_score - ?) WHERE id = ?', [scoreDec, accountId], (err) => {
                            if (err) console.error('Credit Score Update Error', err);

                            db.query('INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)', 
                                [userId, dep.bank_id, accountId, 'deposit_break', refund, 'Mevduat Bozma (Ceza: ' + penalty + ')'], (err) => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Log error' }));

                                    db.query('INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)', 
                                        [userId, dep.bank_id, accountId, 'score_update', 0, `Kredi Puanı Güncellendi (-${scoreDec.toFixed(2)})`], (err) => {
                                            db.commit(err => {
                                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                                                res.json({ success: true, message: 'Mevduat bozuldu.' });
                                            });
                                        });
                                });
                        });
                    });
                });
            });
        });
    });
});// Collect Deposit (Vade Sonu)
app.post('/api/bank-accounts/deposit-collect', (req, res) => {
    const { userId, depositId } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        db.query('SELECT * FROM bank_deposits WHERE id = ? AND user_id = ? AND status = "active"', [depositId, userId], (err, deposits) => {
            if (err || deposits.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Mevduat bulunamadı.' }));
            
            const dep = deposits[0];
            if (new Date() < new Date(dep.end_time)) return db.rollback(() => res.json({ success: false, message: 'Vade henüz dolmadı.' }));

            const totalReturn = dep.amount + dep.interest_amount;

            // Find Account ID first
            db.query('SELECT id FROM bank_accounts WHERE user_id = ? AND bank_id = ?', [userId, dep.bank_id], (err, accounts) => {
                if (err || accounts.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Hesap bulunamadı.' }));
                const accountId = accounts[0].id;

                // Update Status
                db.query('UPDATE bank_deposits SET status = "completed" WHERE id = ?', [depositId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Update status error' }));

                    // Add to Account
                    db.query('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?', [totalReturn, accountId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Pay error' }));

                        // Log
                        db.query('INSERT INTO bank_transactions (user_id, bank_id, bank_account_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?, ?)', 
                            [userId, dep.bank_id, accountId, 'deposit_collect', totalReturn, 'Mevduat Tahsilatı'], (err) => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Log error' }));

                                db.commit(err => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                                    res.json({ success: true, message: 'Mevduat tahsil edildi.' });
                                });
                            });
                    });
                });
            });
        });
    });
});

// Get Bank Logs (For Bank Manager)
app.get('/api/banks/:bankId/logs', (req, res) => {
    const { bankId } = req.params;
    const query = `
        SELECT bt.*, u.username, bt.user_id as user_id_display
        FROM bank_transactions bt
        JOIN users u ON bt.user_id = u.id
        WHERE bt.bank_id = ?
        ORDER BY bt.created_at DESC LIMIT 100
    `;
    db.query(query, [bankId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, logs: results });
    });
});

// Get Bank Customers (For Bank Manager)
app.get('/api/banks/:bankId/customers', (req, res) => {
    const { bankId } = req.params;
    const query = `
        SELECT ba.id, ba.user_id, u.username, ba.balance, ba.loan_debt, ba.iban, ba.created_at, ba.credit_score
        FROM bank_accounts ba
        JOIN users u ON ba.user_id = u.id
        WHERE ba.bank_id = ?
        ORDER BY ba.balance DESC
    `;
    db.query(query, [bankId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, customers: results });
    });
});

// Update Bank Settings
app.post('/api/banks/update', (req, res) => {
    const { userId, name, interestRate, loanRate, transferFee, accountOpeningFee } = req.body;

    db.query('UPDATE banks SET name = ?, interest_rate = ?, loan_rate = ?, transfer_fee = ?, account_opening_fee = ? WHERE owner_id = ?', 
        [name, interestRate, loanRate, transferFee, accountOpeningFee, userId], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'Update error', error: err });
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Banka bulunamadı.' });
            res.json({ success: true, message: 'Banka ayarları güncellendi.' });
        });
});

// Bank Vault Deposit (Owner -> Bank)
app.post('/api/banks/deposit', (req, res) => {
    const { userId, amount } = req.body;
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Geçersiz miktar.' });

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // Check User Money & Get Bank ID
        db.query('SELECT money FROM users WHERE id = ?', [userId], (err, users) => {
            if (err || users.length === 0) return db.rollback(() => res.status(500).json({ success: false, message: 'User error' }));
            if (users[0].money < amount) return db.rollback(() => res.json({ success: false, message: 'Yetersiz nakit.' }));

            db.query('SELECT id, balance FROM banks WHERE owner_id = ?', [userId], (err, banks) => {
                if (err || banks.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Banka bulunamadı.' }));
                const bank = banks[0];

                // Deduct from User
                db.query('UPDATE users SET money = money - ? WHERE id = ?', [amount, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'User update error' }));

                    // Add to Bank Vault
                    db.query('UPDATE banks SET balance = balance + ? WHERE id = ?', [amount, bank.id], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Bank update error' }));

                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                            res.json({ success: true, message: 'Kasaya para yatırıldı.', newBalance: bank.balance + parseInt(amount) });
                        });
                    });
                });
            });
        });
    });
});

// Bank Vault Withdraw (Bank -> Owner)
app.post('/api/banks/withdraw', (req, res) => {
    const { userId, amount } = req.body;
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Geçersiz miktar.' });

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        db.query('SELECT id, balance FROM banks WHERE owner_id = ?', [userId], (err, banks) => {
            if (err || banks.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Banka bulunamadı.' }));
            const bank = banks[0];

            if (bank.balance < amount) return db.rollback(() => res.json({ success: false, message: 'Kasa bakiyesi yetersiz.' }));

            // Deduct from Bank Vault
            db.query('UPDATE banks SET balance = balance - ? WHERE id = ?', [amount, bank.id], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Bank update error' }));

                // Add to User
                db.query('UPDATE users SET money = money + ? WHERE id = ?', [amount, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'User update error' }));

                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                        res.json({ success: true, message: 'Kasadan para çekildi.', newBalance: bank.balance - parseInt(amount) });
                    });
                });
            });
        });
    });
});

// Get Bank Stats
app.get('/api/banks/stats/:bankId', (req, res) => {
    const { bankId } = req.params;
    
    const qDeposits = 'SELECT SUM(amount) as total FROM bank_deposits WHERE bank_id = ? AND status = "active"';
    const qLoans = 'SELECT SUM(loan_debt) as total FROM bank_accounts WHERE bank_id = ?';

    db.query(qDeposits, [bankId], (err, depRes) => {
        if (err) return res.status(500).json({ success: false, error: err });
        
        db.query(qLoans, [bankId], (err, loanRes) => {
            if (err) return res.status(500).json({ success: false, error: err });
            
            res.json({
                success: true,
                totalDeposits: depRes[0].total || 0,
                totalLoans: loanRes[0].total || 0
            });
        });
    });
});

// --- HOSPITAL SYSTEM ---

// Create Hospitals Table
const createHospitalsTable = `
    CREATE TABLE IF NOT EXISTS hospitals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        level INT DEFAULT 1,
        capacity INT DEFAULT 5,
        quality INT DEFAULT 100,
        price INT DEFAULT 100,
        balance INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

db.query(createHospitalsTable, (err) => {
    if (err) console.error('Hospitals table creation failed:', err);
    else {
        console.log('Hospitals table ready');
        
        // Ensure columns exist (for existing tables)
        const checkAndAddColumn = (colName, colDef) => {
            db.query(`SHOW COLUMNS FROM hospitals LIKE '${colName}'`, (err, result) => {
                if (!err && result.length === 0) {
                    db.query(`ALTER TABLE hospitals ADD COLUMN ${colName} ${colDef}`, (err) => {
                        if (err) console.error(`Error adding ${colName} column:`, err);
                        else console.log(`Added ${colName} column to hospitals`);
                    });
                }
            });
        };

        checkAndAddColumn('balance', 'INT DEFAULT 0');
        checkAndAddColumn('price', 'INT DEFAULT 100');
        checkAndAddColumn('total_treatments', 'INT DEFAULT 0');
    }
});

// Create Hospital Treatments Table (Logs)
const createHospitalTreatmentsTable = `
    CREATE TABLE IF NOT EXISTS hospital_treatments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hospital_id INT NOT NULL,
        patient_name VARCHAR(255) NOT NULL,
        price INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

db.query(createHospitalTreatmentsTable, (err) => {
    if (err) console.error('Hospital Treatments table creation failed:', err);
    else console.log('Hospital Treatments table ready');
});

// Create Hospital Active Treatments Table
const createHospitalActiveTreatmentsTable = `
    CREATE TABLE IF NOT EXISTS hospital_active_treatments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hospital_id INT NOT NULL,
        user_id INT NOT NULL,
        bed_index INT NOT NULL,
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME NOT NULL,
        UNIQUE KEY unique_bed (hospital_id, bed_index),
        UNIQUE KEY unique_user (user_id)
    )
`;

db.query(createHospitalActiveTreatmentsTable, (err) => {
    if (err) console.error('Hospital Active Treatments table creation failed:', err);
    else console.log('Hospital Active Treatments table ready');
});

// Get All Hospitals
app.get('/api/hospitals', (req, res) => {
    const query = `
        SELECT h.*, u.username as owner_name,
        (SELECT COUNT(*) FROM hospital_active_treatments WHERE hospital_id = h.id) as active_patients
        FROM hospitals h 
        JOIN users u ON h.user_id = u.id 
        ORDER BY h.quality DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json(results);
    });
});

// Get My Hospital
app.get('/api/hospitals/my/:userId', (req, res) => {
    const { userId } = req.params;
    console.log(`[Hospital Check] Checking hospital for user ${userId}`);
    
    db.query('SELECT * FROM hospitals WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            console.error("[Hospital Check] DB Error:", err);
            return res.status(500).json({ success: false, error: err });
        }
        
        if (results.length > 0) {
            let hospital = results[0];
            console.log(`[Hospital Check] Found hospital: ${hospital.id} for user ${userId}`);

            // Check for Upgrade Completion
            if (hospital.upgrade_end_time) {
                const now = new Date();
                const upgradeEnd = new Date(hospital.upgrade_end_time);
                
                if (now >= upgradeEnd) {
                    // Upgrade Finished!
                    const newLevel = hospital.level + 1;
                    const newCapacity = newLevel * 5; // Capacity = Level * 5
                    
                    const updateQuery = 'UPDATE hospitals SET level = ?, capacity = ?, upgrade_end_time = NULL WHERE id = ?';
                    db.query(updateQuery, [newLevel, newCapacity, hospital.id], (err) => {
                        if (err) console.error("Upgrade Apply Error:", err);
                        else {
                            console.log(`Hospital ${hospital.id} upgraded to level ${newLevel}`);
                            hospital.level = newLevel;
                            hospital.capacity = newCapacity;
                            hospital.upgrade_end_time = null;
                        }
                        
                        // Return response after update attempt
                        sendResponse(hospital);
                    });
                    return;
                }
            }
            
            sendResponse(hospital);

            function sendResponse(hospData) {
                // Get Logs
                db.query('SELECT * FROM hospital_treatments WHERE hospital_id = ? ORDER BY created_at DESC LIMIT 50', [hospData.id], (err, logs) => {
                    if (err) {
                        console.error("[Hospital Check] Logs DB Error:", err);
                        return res.json({ success: true, hasHospital: true, hospital: hospData, logs: [] });
                    }
                    res.json({ success: true, hasHospital: true, hospital: hospData, logs: logs });
                });
            }

        } else {
            console.log(`[Hospital Check] No hospital found for user ${userId}`);
            res.json({ success: true, hasHospital: false });
        }
    });
});

// Buy Hospital
app.post('/api/hospitals/buy', (req, res) => {
    const { userId, name } = req.body;
    const costMoney = 50000; // Base cost
    const tax = 5000;
    const totalMoney = costMoney + tax;
    const costGold = 500;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // Check User & License
        db.query('SELECT money, gold, license_hospital_level FROM users WHERE id = ?', [userId], (err, users) => {
            if (err || users.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' }));
            
            const user = users[0];
            
            // Check License
            if (!user.license_hospital_level || user.license_hospital_level < 1) {
                return db.rollback(() => res.json({ success: false, message: 'Hastane lisansınız yok! Önce lisans almalısınız.' }));
            }

            // Check Existing Hospital
            db.query('SELECT id FROM hospitals WHERE user_id = ?', [userId], (err, hospitals) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'DB Error' }));
                if (hospitals.length > 0) return db.rollback(() => res.json({ success: false, message: 'Zaten bir hastaneniz var.' }));

                // Check Balance
                if (user.money < totalMoney || user.gold < costGold) {
                    return db.rollback(() => res.json({ success: false, message: 'Yetersiz bakiye.' }));
                }

                // Deduct Money
                db.query('UPDATE users SET money = money - ?, gold = gold - ? WHERE id = ?', [totalMoney, costGold, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Update error' }));

                    // Create Hospital
                    const insertQuery = 'INSERT INTO hospitals (user_id, name, level, capacity, quality, price) VALUES (?, ?, 1, 5, 100, 100)';
                    db.query(insertQuery, [userId, name], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Insert error' }));

                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                            res.json({ success: true, message: 'Hastane başarıyla satın alındı!' });
                        });
                    });
                });
            });
        });
    });
});

// Treat User
app.post('/api/hospital/treat', (req, res) => {
    const { userId, hospitalId } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // 1. Check if user is already being treated
        db.query('SELECT id FROM hospital_active_treatments WHERE user_id = ?', [userId], (err, active) => {
            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'DB Error' }));
            if (active.length > 0) return db.rollback(() => res.json({ success: false, message: 'Zaten tedavi görüyorsunuz.' }));

            // 2. Get Hospital Info & Capacity
            db.query('SELECT * FROM hospitals WHERE id = ?', [hospitalId], (err, hospitals) => {
                if (err || hospitals.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Hastane bulunamadı.' }));
                const hospital = hospitals[0];
                const price = hospital.price;
                const capacity = hospital.capacity;

                // 3. Find Available Bed
                db.query('SELECT bed_index FROM hospital_active_treatments WHERE hospital_id = ?', [hospitalId], (err, beds) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'DB Error' }));
                    
                    const occupiedBeds = beds.map(b => b.bed_index);
                    let freeBed = -1;
                    for (let i = 1; i <= capacity; i++) {
                        if (!occupiedBeds.includes(i)) {
                            freeBed = i;
                            break;
                        }
                    }

                    if (freeBed === -1) return db.rollback(() => res.json({ success: false, message: 'Hastane dolu.' }));

                    // 4. Get User Info
                    db.query('SELECT username, money, health FROM users WHERE id = ?', [userId], (err, users) => {
                        if (err || users.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' }));
                        const user = users[0];

                        if (user.health >= 100) return db.rollback(() => res.json({ success: false, message: 'Sağlığınız zaten dolu.' }));
                        if (user.money < price) return db.rollback(() => res.json({ success: false, message: 'Yetersiz bakiye.' }));

                        // 5. Deduct Money (Don't heal yet)
                        db.query('UPDATE users SET money = money - ? WHERE id = ?', [price, userId], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'User update error' }));

                            // 6. Add Money to Hospital Balance
                            db.query('UPDATE hospitals SET balance = balance + ?, total_treatments = total_treatments + 1 WHERE id = ?', [price, hospital.id], (err) => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Hospital update error' }));

                                // 7. Start Treatment (Dynamic Duration)
                                // Level 1 = 20 mins, Level 10 = 3 mins. Formula: Max(3, 20 - (level-1)*2)
                                const durationMinutes = Math.max(3, 20 - (hospital.level - 1) * 2);
                                const endTime = new Date(Date.now() + durationMinutes * 60000);
                                
                                db.query('INSERT INTO hospital_active_treatments (hospital_id, user_id, bed_index, end_time) VALUES (?, ?, ?, ?)', 
                                    [hospitalId, userId, freeBed, endTime], (err) => {
                                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Insert treatment error' }));

                                        // 8. Log Treatment
                                        db.query('INSERT INTO hospital_treatments (hospital_id, patient_name, price) VALUES (?, ?, ?)', 
                                            [hospitalId, user.username || 'Unknown', price], (err) => {
                                                // Ignore log error
                                                db.commit(err => {
                                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                                                    res.json({ success: true, message: `Tedavi başladı! ${durationMinutes} dakika sürecek.` });
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
});

// Hospital Details
app.get('/api/hospital/:id/details', (req, res) => {
    const { id } = req.params;
    db.query('SELECT h.*, u.username as owner_name FROM hospitals h JOIN users u ON h.user_id = u.id WHERE h.id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        
        const hospital = results[0];

        // Get Active Treatments
        const activeQuery = `
            SELECT hat.*, u.username 
            FROM hospital_active_treatments hat 
            JOIN users u ON hat.user_id = u.id 
            WHERE hat.hospital_id = ?
        `;
        db.query(activeQuery, [id], (err, activeTreatments) => {
            if (err) return res.status(500).json({ success: false, error: err });

            // Get History
            db.query('SELECT * FROM hospital_treatments WHERE hospital_id = ? ORDER BY created_at DESC LIMIT 20', [id], (err, history) => {
                if (err) return res.status(500).json({ success: false, error: err });
                
                res.json({ success: true, data: hospital, activeTreatments: activeTreatments, history: history });
            });
        });
    });
});

// Update Hospital Settings
app.post('/api/hospital/update', (req, res) => {
    const { userId, name, price } = req.body;
    
    console.log(`[Hospital Update] Request for UserID: ${userId}, Name: ${name}, Price: ${price}`);

    if (!name || name.length < 3) return res.json({ success: false, message: 'İsim en az 3 karakter olmalı.' });
    if (isNaN(price) || price < 0 || price > 10000) return res.json({ success: false, message: 'Fiyat 0-10000 arası olmalı.' });

    db.query('UPDATE hospitals SET name = ?, price = ? WHERE user_id = ?', [name, price, userId], (err, result) => {
        if (err) {
            console.error("[Hospital Update] SQL Error:", err);
            return res.status(500).json({ success: false, message: 'Veritabanı hatası: ' + err.sqlMessage });
        }
        if (result.affectedRows === 0) {
            console.warn("[Hospital Update] No hospital found for user:", userId);
            return res.status(404).json({ success: false, message: 'Hastane bulunamadı.' });
        }
        console.log("[Hospital Update] Success");
        res.json({ success: true, message: 'Ayarlar güncellendi.' });
    });
});

// Upgrade Hospital
app.post('/api/hospital/upgrade', (req, res) => {
    const { userId } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // Get Hospital & User
        const query = `
            SELECT h.id, h.level, h.capacity, h.upgrade_end_time, u.money, u.gold, u.diamond, u.license_hospital_level 
            FROM hospitals h 
            JOIN users u ON h.user_id = u.id 
            WHERE h.user_id = ?
        `;
        db.query(query, [userId], (err, results) => {
            if (err || results.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Hastane bulunamadı.' }));
            
            const data = results[0];
            
            // Check if already upgrading
            if (data.upgrade_end_time) {
                const now = new Date();
                const upgradeEnd = new Date(data.upgrade_end_time);
                if (now < upgradeEnd) {
                    return db.rollback(() => res.json({ success: false, message: 'Hastane zaten geliştiriliyor.' }));
                }
            }

            const nextLevel = data.level + 1;
            if (nextLevel > 10) return db.rollback(() => res.json({ success: false, message: 'Maksimum seviyeye ulaşıldı.' }));
            
            // Costs
            const costMoney = Math.floor(250000 * Math.pow(1.65, data.level - 1));
            const costGold = Math.floor(100 * Math.pow(data.level, 1.8));
            // Diamond cost starts from level 5 (upgrading to 6)
            const costDiamond = (data.level >= 5) ? Math.floor(25 * Math.pow(data.level - 4, 2)) : 0;

            // Checks
            if ((data.license_hospital_level || 0) < nextLevel) return db.rollback(() => res.json({ success: false, message: `Yetersiz Lisans! Seviye ${nextLevel} lisans gerekli.` }));
            if (data.money < costMoney) return db.rollback(() => res.json({ success: false, message: 'Yetersiz Para.' }));
            if (data.gold < costGold) return db.rollback(() => res.json({ success: false, message: 'Yetersiz Altın.' }));
            if ((data.diamond || 0) < costDiamond) return db.rollback(() => res.json({ success: false, message: 'Yetersiz Elmas.' }));

            // Duration
            // 1->2: 3h, 2->3: 6h ... Level * 3 hours
            const durationHours = data.level * 3;
            const endTime = new Date();
            endTime.setHours(endTime.getHours() + durationHours);

            // Deduct & Start Upgrade
            db.query('UPDATE users SET money = money - ?, gold = gold - ?, diamond = diamond - ? WHERE id = ?', [costMoney, costGold, costDiamond, userId], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'User update error' }));

                // Set upgrade_end_time, do NOT change level yet
                db.query('UPDATE hospitals SET upgrade_end_time = ? WHERE id = ?', [endTime, data.id], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Hospital update error' }));

                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                        res.json({ 
                            success: true, 
                            message: `Geliştirme başladı! Süre: ${durationHours} Saat.`,
                            upgradeEndTime: endTime
                        });
                    });
                });
            });
        });
    });
});

// Withdraw Money from Hospital
app.post('/api/hospital/withdraw', (req, res) => {
    const { userId, amount } = req.body;
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Geçersiz miktar.' });

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        db.query('SELECT id, balance FROM hospitals WHERE user_id = ?', [userId], (err, hospitals) => {
            if (err || hospitals.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Hastane bulunamadı.' }));
            
            const hospital = hospitals[0];
            if (hospital.balance < amount) return db.rollback(() => res.json({ success: false, message: 'Yetersiz bakiye.' }));

            db.query('UPDATE hospitals SET balance = balance - ? WHERE id = ?', [amount, hospital.id], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Hospital update error' }));

                db.query('UPDATE users SET money = money + ? WHERE id = ?', [amount, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'User update error' }));

                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                        res.json({ success: true, message: 'Para çekildi.' });
                    });
                });
            });
        });
    });
});

// Get Hospital Stats
app.get('/api/hospitals/stats/:hospitalId', (req, res) => {
    const { hospitalId } = req.params;
    
    const qPatients = 'SELECT COUNT(*) as total FROM treatments WHERE hospital_id = ?';
    const qIncome = 'SELECT SUM(amount) as total FROM transactions WHERE hospital_id = ? AND type = "income"';
    const qExpenses = 'SELECT SUM(amount) as total FROM transactions WHERE hospital_id = ? AND type = "expense"';

    db.query(qPatients, [hospitalId], (err, patientRes) => {
        if (err) return res.status(500).json({ success: false, error: err });
        
        db.query(qIncome, [hospitalId], (err, incomeRes) => {
            if (err) return res.status(500).json({ success: false, error: err });
            
            db.query(qExpenses, [hospitalId], (err, expenseRes) => {
                if (err) return res.status(500).json({ success: false, error: err });
                
                const totalIncome = incomeRes[0].total || 0;
                const totalExpenses = expenseRes[0].total || 0;
                const profit = totalIncome - totalExpenses;

                res.json({
                    success: true,
                    totalPatients: patientRes[0].total || 0,
                    totalIncome: totalIncome,
                    totalExpenses: totalExpenses,
                    profit: profit
                });
            });
        });
    });
});

// Get Treatment History
app.get('/api/treatments/history/:userId', (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT t.*, h.name as hospital_name, h.id as hospital_id
        FROM treatments t
        JOIN hospitals h ON t.hospital_id = h.id
        WHERE t.user_id = ?
        ORDER BY t.date DESC
    `;
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, history: results });
    });
});

// Get User Treatment Status
app.get('/api/treatment/status/:userId', (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT t.*, h.name as hospital_name, h.id as hospital_id
        FROM treatments t
        JOIN hospitals h ON t.hospital_id = h.id
        WHERE t.user_id = ? AND t.status = 'active'
        ORDER BY t.date DESC
    `;
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, treatment: results.length > 0 });
    });
});

// Start Treatment
app.post('/api/treatment/start', (req, res) => {
    const { userId, hospitalId } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // Check Hospital
        db.query('SELECT * FROM hospitals WHERE id = ?', [hospitalId], (err, hospitals) => {
            if (err || hospitals.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Hastane bulunamadı.' }));
            const hospital = hospitals[0];

            // Check User
            db.query('SELECT * FROM users WHERE id = ?', [userId], (err, users) => {
                if (err || users.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' }));
                const user = users[0];

                // Check if already treated
                db.query('SELECT * FROM treatments WHERE user_id = ? AND hospital_id = ? AND status = "active"', [userId, hospitalId], (err, treatments) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Treatment check error' }));
                    if (treatments.length > 0) {
                        return db.rollback(() => res.json({ success: false, message: 'Zaten tedavi ediliyorsunuz.' }));
                    }

                    // Start Treatment
                    const query = 'INSERT INTO treatments (user_id, hospital_id, status, date) VALUES (?, ?, "active", NOW())';
                    db.query(query, [userId, hospitalId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Tedavi başlatılamadı.' }));

                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                            res.json({ success: true, message: 'Tedaviye başlandı.' });
                        });
                    });
                });
            });
        });
    });
});

// Complete Treatment
app.post('/api/treatment/complete', (req, res) => {
    const { userId, hospitalId } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // Check Treatment
        db.query('SELECT * FROM treatments WHERE user_id = ? AND hospital_id = ? AND status = "active"', [userId, hospitalId], (err, treatments) => {
            if (err || treatments.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Tedavi bulunamadı.' }));
            const treatment = treatments[0];

            // Complete Treatment
            db.query('UPDATE treatments SET status = "completed", date = NOW() WHERE id = ?', [treatment.id], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Tedavi tamamlanamadı.' }));

                db.commit(err => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                    res.json({ success: true, message: 'Tedavi tamamlandı.' });
                });
            });
        });
    });
});

// Get Hospital Queue
app.get('/api/hospital/queue/:hospitalId', (req, res) => {
    const { hospitalId } = req.params;
    const query = `
        SELECT t.*, u.username
        FROM treatments t
        JOIN users u ON t.user_id = u.id
        WHERE t.hospital_id = ? AND t.status = 'active'
        ORDER BY t.date ASC
    `;
    db.query(query, [hospitalId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, queue: results });
    });
});

// Get User Treatment Queue Position
app.get('/api/treatment/queue-position/:userId', (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT COUNT(*) as position
        FROM treatments t
        WHERE t.hospital_id = (SELECT id FROM hospitals WHERE user_id = ?)
        AND t.status = 'active'
        AND t.date <= (SELECT date FROM treatments WHERE user_id = ? AND status = 'active' LIMIT 1)
    `;
    db.query(query, [userId, userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, position: results[0].position + 1 });
    });
});

// Cancel Treatment
app.post('/api/treatment/cancel', (req, res) => {
    const { userId, hospitalId } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // Check Treatment
        db.query('SELECT * FROM treatments WHERE user_id = ? AND hospital_id = ? AND status = "active"', [userId, hospitalId], (err, treatments) => {
            if (err || treatments.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Tedavi bulunamadı.' }));
            const treatment = treatments[0];

            // Cancel Treatment
            db.query('UPDATE treatments SET status = "canceled" WHERE id = ?', [treatment.id], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Tedavi iptal edilemedi.' }));

                db.commit(err => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                    res.json({ success: true, message: 'Tedavi iptal edildi.' });
                });
            });
        });
    });
});

// Get User Active Treatment
app.get('/api/treatment/active/:userId', (req, res) => {
    const { userId } = req.params;
    const query = `
        SELECT t.*, h.name as hospital_name, h.id as hospital_id
        FROM treatments t
        JOIN hospitals h ON t.hospital_id = h.id
        WHERE t.user_id = ? AND t.status = 'active'
        ORDER BY t.date DESC
    `;
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, treatment: results.length > 0 ? results[0] : null });
    });
});

// Get Treatment Details
app.get('/api/treatment/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT t.*, h.name as hospital_name, h.id as hospital_id FROM treatments t JOIN hospitals h ON t.hospital_id = h.id WHERE t.id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: results[0] });
    });
});

// --- DAILY JOBS SYSTEM ---

const DAILY_JOBS = [
    { id: 1, name: "Sokak Temizliği", time: 30, minLevel: 1, costH: 5, costE: 10, reward: { money: 100, xp: 10 }, icon: "fa-broom" },
    { id: 2, name: "Garsonluk", time: 60, minLevel: 2, costH: 8, costE: 15, reward: { money: 250, xp: 20 }, icon: "fa-utensils" },
    { id: 3, name: "Kuryelik", time: 90, minLevel: 3, costH: 10, costE: 20, reward: { money: 400, xp: 35 }, icon: "fa-motorcycle" },
    { id: 4, name: "Depo İşçiliği", time: 120, minLevel: 5, costH: 15, costE: 25, reward: { money: 600, xp: 50 }, icon: "fa-boxes-packing" },
    { id: 5, name: "Taksi Şoförlüğü", time: 150, minLevel: 8, costH: 10, costE: 30, reward: { money: 850, xp: 75, gold: 1 }, icon: "fa-taxi" },
    { id: 6, name: "Güvenlik Görevlisi", time: 180, minLevel: 12, costH: 20, costE: 20, reward: { money: 1200, xp: 100, gold: 2 }, icon: "fa-shield-halved" },
    { id: 7, name: "Yazılım Geliştirme", time: 240, minLevel: 15, costH: 5, costE: 40, reward: { money: 2000, xp: 150, gold: 5 }, icon: "fa-laptop-code" },
    { id: 8, name: "Banka Müdürlüğü", time: 300, minLevel: 20, costH: 10, costE: 50, reward: { money: 5000, xp: 300, gold: 10, diamond: 1 }, icon: "fa-building-columns" },
    { id: 9, name: "Pilotluk", time: 360, minLevel: 25, costH: 15, costE: 60, reward: { money: 8000, xp: 500, gold: 20, diamond: 2 }, icon: "fa-plane" },
    { id: 10, name: "Gizli Ajanlık", time: 420, minLevel: 30, costH: 50, costE: 80, reward: { money: 15000, xp: 1000, gold: 50, diamond: 5 }, icon: "fa-user-secret" }
];

// Create Daily Job Tables
const createDailyJobTables = () => {
    const q1 = `
        CREATE TABLE IF NOT EXISTS daily_job_completions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            job_id INT NOT NULL,
            completion_date DATE NOT NULL,
            UNIQUE KEY unique_daily_job (user_id, job_id, completion_date)
        )
    `;
    const q2 = `
        CREATE TABLE IF NOT EXISTS active_daily_jobs (
            user_id INT PRIMARY KEY,
            job_id INT NOT NULL,
            start_time DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    const q3 = `
        CREATE TABLE IF NOT EXISTS daily_job_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            job_id INT NOT NULL,
            reward_text VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(q1, (err) => { if(err) console.error('Daily Job Completions Table Error', err); });
    db.query(q2, (err) => { if(err) console.error('Active Daily Jobs Table Error', err); });
    db.query(q3, (err) => { if(err) console.error('Daily Job Logs Table Error', err); });
};
createDailyJobTables();

// Get Jobs List
app.get('/api/daily-jobs', (req, res) => {
    res.json(DAILY_JOBS);
});

// Get User Job Status
app.get('/api/daily-jobs/status/:userId', (req, res) => {
    const { userId } = req.params;
    
    // 1. Get Completed Jobs Today
    const qCompleted = 'SELECT job_id FROM daily_job_completions WHERE user_id = ? AND completion_date = CURDATE()';
    
    // 2. Get Active Job
    const qActive = 'SELECT * FROM active_daily_jobs WHERE user_id = ?';

    // 3. Get Logs (REMOVED FOR USER)
    // const qLogs = 'SELECT * FROM daily_job_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20';

    db.query(qCompleted, [userId], (err, completedRes) => {
        if (err) return res.status(500).json({ success: false, error: err });
        
        db.query(qActive, [userId], (err, activeRes) => {
            if (err) return res.status(500).json({ success: false, error: err });

            // db.query(qLogs, [userId], (err, logsRes) => { // REMOVED
                // if (err) return res.status(500).json({ success: false, error: err });

                const completedIds = completedRes.map(r => r.job_id);
                const activeJob = activeRes.length > 0 ? activeRes[0] : null;

                // Calculate remaining time if active
                let activeJobData = null;
                if (activeJob) {
                    const jobDef = DAILY_JOBS.find(j => j.id === activeJob.job_id);
                    if (jobDef) {
                        let remaining;
                        if (activeJob.end_time) {
                            const endTime = new Date(activeJob.end_time).getTime();
                            remaining = Math.max(0, (endTime - Date.now()) / 1000);
                        } else {
                            const startTime = new Date(activeJob.start_time).getTime();
                            const elapsed = (Date.now() - startTime) / 1000;
                            remaining = Math.max(0, jobDef.time - elapsed);
                        }
                        
                        activeJobData = {
                            ...activeJob,
                            name: jobDef.name,
                            totalTime: jobDef.time,
                            remainingTime: remaining
                        };
                    }
                }

                res.json({
                    success: true,
                    completedJobs: completedIds,
                    activeJob: activeJobData,
                    logs: [] // Empty logs for user
                });
            // });
        });
    });
});

// Start Job
app.post('/api/daily-jobs/start', (req, res) => {
    const { userId, jobId } = req.body;
    
    const job = DAILY_JOBS.find(j => j.id === jobId);
    if (!job) return res.status(400).json({ success: false, message: 'İş bulunamadı.' });

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // 1. Check Active Job
        db.query('SELECT * FROM active_daily_jobs WHERE user_id = ?', [userId], (err, activeRes) => {
            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'DB Error' }));
            if (activeRes.length > 0) return db.rollback(() => res.json({ success: false, message: 'Zaten çalışan bir işin var.' }));

            // 2. Check Completed Today
            db.query('SELECT * FROM daily_job_completions WHERE user_id = ? AND job_id = ? AND completion_date = CURDATE()', [userId, jobId], (err, compRes) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'DB Error' }));
                if (compRes.length > 0) return db.rollback(() => res.json({ success: false, message: 'Bu işi bugün zaten yaptın.' }));

                // 3. Check User Stats (Level, Health, Energy)
                db.query('SELECT level, health, energy FROM users WHERE id = ?', [userId], (err, users) => {
                    if (err || users.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' }));
                    const user = users[0];

                    if (user.level < job.minLevel) return db.rollback(() => res.json({ success: false, message: 'Seviyen yetersiz.' }));
                    if (user.health < job.costH) return db.rollback(() => res.json({ success: false, message: 'Sağlığın yetersiz.' }));
                    if (user.energy < job.costE) return db.rollback(() => res.json({ success: false, message: 'Enerjin yetersiz.' }));

                    // 4. Deduct Costs Immediately
                    const newHealth = user.health - job.costH;
                    const newEnergy = user.energy - job.costE;

                    db.query('UPDATE users SET health = ?, energy = ? WHERE id = ?', [newHealth, newEnergy, userId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Cost deduction error' }));

                        // 5. Start Job (Insert Active)
                        const startTime = new Date();
                        const endTime = new Date(startTime.getTime() + job.time * 1000);

                        // Format dates for MySQL (YYYY-MM-DD HH:mm:ss) to avoid timezone issues
                        const toMysqlFormat = (date) => date.toISOString().slice(0, 19).replace('T', ' ');
                        
                        // Note: Using local time might be better if DB is local, but ISO is UTC. 
                        // Let's rely on the driver to handle Date objects, but ensure we are consistent.
                        // Actually, let's use MySQL NOW() and DATE_ADD for consistency on DB side.
                        
                        const qInsert = `INSERT INTO active_daily_jobs (user_id, job_id, start_time, end_time) 
                                         VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? SECOND))`;

                        db.query(qInsert, [userId, jobId, job.time], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Start job error' }));

                            // Log Start
                            const logText = `${job.name} başladı.`;
                            db.query('INSERT INTO daily_job_logs (user_id, job_id, reward_text) VALUES (?, ?, ?)', [userId, jobId, logText], (err) => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Log error' }));

                                db.commit(err => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                                    res.json({ 
                                        success: true, 
                                        message: 'İş başladı!', 
                                        duration: job.time,
                                        newStats: { health: newHealth, energy: newEnergy }
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

// Complete Job
app.post('/api/daily-jobs/complete', (req, res) => {
    const { userId, jobId } = req.body;
    console.log(`Completing job ${jobId} for user ${userId}`);

    const job = DAILY_JOBS.find(j => j.id === jobId);
    if (!job) return res.status(400).json({ success: false, message: 'İş bulunamadı.' });

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // 1. Get Active Job
        db.query('SELECT * FROM active_daily_jobs WHERE user_id = ? AND job_id = ?', [userId, jobId], (err, activeRes) => {
            if (err) {
                console.error("DB Error active_daily_jobs:", err);
                return db.rollback(() => res.status(500).json({ success: false, message: 'DB Error' }));
            }
            if (activeRes.length === 0) {
                console.log("Active job not found for user", userId);
                return db.rollback(() => res.json({ success: false, message: 'Aktif iş bulunamadı.' }));
            }

            const activeJob = activeRes[0];
            
            // Check Time
            let isTimeUp = false;
            if (activeJob.end_time) {
                const endTime = new Date(activeJob.end_time).getTime();
                if (Date.now() >= (endTime - 2000)) isTimeUp = true;
            } else {
                const startTime = new Date(activeJob.start_time).getTime();
                const elapsed = (Date.now() - startTime) / 1000;
                if (elapsed >= (job.time - 2)) isTimeUp = true;
            }

            if (!isTimeUp) {
                return db.rollback(() => res.json({ success: false, message: 'Süre henüz dolmadı!' }));
            }

            // 2. Get User (For Rewards)
            db.query('SELECT money, gold, diamond, xp, health, energy, level FROM users WHERE id = ?', [userId], (err, users) => {
                if (err) {
                    console.error("DB Error users:", err);
                    return db.rollback(() => res.status(500).json({ success: false, message: 'DB Error' }));
                }
                if (users.length === 0) {
                    console.error("User not found in DB:", userId);
                    return db.rollback(() => res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' }));
                }
                const user = users[0];

                // Calculate New Values (Costs already deducted at start)
                const newMoney = user.money + job.reward.money;
                const newGold = user.gold + (job.reward.gold || 0);
                const newDiamond = (user.diamond || 0) + (job.reward.diamond || 0);
                
                // Level Up Logic
                let currentLevel = user.level || 1;
                let currentXp = (user.xp || 0) + job.reward.xp;
                let leveledUp = false;
                
                // Simple formula: Level * 100 XP required for next level
                // Example: Level 1 needs 100 XP. Level 2 needs 200 XP.
                let requiredXp = currentLevel * 100;

                while (currentXp >= requiredXp) {
                    currentXp -= requiredXp;
                    currentLevel++;
                    requiredXp = currentLevel * 100;
                    leveledUp = true;
                }

                // Update User Rewards
                const updateQ = 'UPDATE users SET money = ?, gold = ?, diamond = ?, xp = ?, level = ? WHERE id = ?';
                db.query(updateQ, [newMoney, newGold, newDiamond, currentXp, currentLevel, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'User update error' }));

                    // 3. Mark Completed
                    db.query('INSERT INTO daily_job_completions (user_id, job_id, completion_date) VALUES (?, ?, CURDATE())', [userId, jobId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Completion insert error' }));

                        // 4. Remove Active
                        db.query('DELETE FROM active_daily_jobs WHERE user_id = ?', [userId], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Active delete error' }));

                            // 5. Log
                            const logText = `${job.name} tamamlandı. +${job.reward.money} Para, +${job.reward.xp} XP`;
                            db.query('INSERT INTO daily_job_logs (user_id, job_id, reward_text) VALUES (?, ?, ?)', [userId, jobId, logText], (err) => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Log error' }));

                                db.commit(err => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                                    
                                    let msg = 'İş tamamlandı!';
                                    if (leveledUp) {
                                        msg += ` Tebrikler! Seviye atladın! Yeni Seviye: ${currentLevel}`;
                                    }

                                    res.json({ 
                                        success: true, 
                                        message: msg,
                                        rewards: job.reward,
                                        newStats: { 
                                            money: newMoney, 
                                            gold: newGold, 
                                            diamond: newDiamond, 
                                            xp: currentXp,
                                            level: currentLevel
                                        }
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

// --- ADMIN SYSTEM ---


// Ensure users table has necessary columns
const checkAndAddUserColumn = (colName, colDef) => {
    db.query(`SHOW COLUMNS FROM users LIKE '${colName}'`, (err, result) => {
        if (!err && result.length === 0) {
            db.query(`ALTER TABLE users ADD COLUMN ${colName} ${colDef}`, (err) => {
                if (err) console.error(`Error adding ${colName} column to users:`, err);
                else console.log(`Added ${colName} column to users`);
            });
        }
    });
};
checkAndAddUserColumn('diamond', 'INT DEFAULT 0');
checkAndAddUserColumn('gold', 'INT DEFAULT 0');
checkAndAddUserColumn('xp', 'INT DEFAULT 0');
checkAndAddUserColumn('level', 'INT DEFAULT 1');

app.get('/api/admin/users', (req, res) => {
    db.query('SELECT id, username, money, gold, diamond, energy, health, level FROM users', (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json(results);
    });
});

app.post('/api/admin/update-user', (req, res) => {
    const { id, money, gold, diamond, energy, health, level } = req.body;
    const query = 'UPDATE users SET money = ?, gold = ?, diamond = ?, energy = ?, health = ?, level = ? WHERE id = ?';
    db.query(query, [money, gold, diamond, energy, health, level, id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, message: 'Kullanıcı güncellendi.' });
    });
});

// Get Daily Job Logs (Admin)
app.get('/api/admin/daily-job-logs', (req, res) => {
    const query = `
        SELECT l.*, u.username, j.name as job_name 
        FROM daily_job_logs l 
        JOIN users u ON l.user_id = u.id 
        LEFT JOIN (
            SELECT 1 as id, 'Sokak Temizliği' as name UNION ALL
            SELECT 2, 'Garsonluk' UNION ALL
            SELECT 3, 'Kuryelik' UNION ALL
            SELECT 4, 'Depo İşçiliği' UNION ALL
            SELECT 5, 'Taksi Şoförlüğü' UNION ALL
            SELECT 6, 'Güvenlik Görevlisi' UNION ALL
            SELECT 7, 'Yazılım Geliştirme' UNION ALL
            SELECT 8, 'Banka Müdürlüğü' UNION ALL
            SELECT 9, 'Pilotluk' UNION ALL
            SELECT 10, 'Gizli Ajanlık'
        ) j ON l.job_id = j.id
        ORDER BY l.created_at DESC LIMIT 100
    `;
    // Note: Since jobs are in memory array in server.js, we can't join easily in SQL unless we create a jobs table.
    // For now, I'll just fetch logs and map job names in JS or use a simple CASE/UNION if I really want SQL.
    // Actually, let's just fetch logs and users, and I'll map job names in the response.
    
    const q = `SELECT l.*, u.username FROM daily_job_logs l JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT 100`;
    
    db.query(q, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        
        // Map job names
        const enriched = results.map(r => {
            const job = DAILY_JOBS.find(j => j.id === r.job_id);
            return { ...r, job_name: job ? job.name : 'Bilinmeyen İş' };
        });
        
        res.json(enriched);
    });
});

// --- END ADMIN SYSTEM ---

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
