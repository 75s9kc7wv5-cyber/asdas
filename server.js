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

            // Update Status
            db.query('UPDATE bank_deposits SET status = "completed" WHERE id = ?', [depositId], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Update status error' }));

                // Add to Account
                db.query('UPDATE bank_accounts SET balance = balance + ? WHERE user_id = ? AND bank_id = ?', [totalReturn, userId, dep.bank_id], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Pay error' }));

                    // Log
                    db.query('INSERT INTO bank_transactions (user_id, bank_id, transaction_type, amount, description) VALUES (?, ?, ?, ?, ?)', 
                        [userId, dep.bank_id, 'deposit_collect', totalReturn, 'Mevduat Tahsilatı'], (err) => {
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

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
