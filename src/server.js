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
app.use(express.static(path.join(__dirname, '../public')));

// Root Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
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

// EDUCATION SYSTEM ENDPOINTS

// Get Education Status
app.get('/api/education/status/:userId', (req, res) => {
    const userId = req.params.userId;
    
    // Check active education
    const activeQuery = 'SELECT * FROM active_educations WHERE user_id = ?';
    db.query(activeQuery, [userId], (err, activeRes) => {
        if (err) return res.status(500).json({ error: err });
        
        const activeEdu = activeRes.length > 0 ? activeRes[0] : null;
        
        // Get user skill
        const userQuery = 'SELECT education_skill FROM users WHERE id = ?';
        db.query(userQuery, [userId], (err, userRes) => {
            if (err) return res.status(500).json({ error: err });
            
            const skill = userRes.length > 0 ? userRes[0].education_skill : 1;
            res.json({ skill, activeEdu });
        });
    });
});

// Start Education
app.post('/api/education/start', (req, res) => {
    const { userId } = req.body;
    
    // 1. Check if already educating
    const activeQuery = 'SELECT * FROM active_educations WHERE user_id = ?';
    db.query(activeQuery, [userId], (err, activeRes) => {
        if (err) return res.status(500).json({ success: false, message: 'DB Error' });
        if (activeRes.length > 0) return res.json({ success: false, message: 'Zaten devam eden bir eğitim var.' });
        
        // 2. Get User Info
        const userQuery = 'SELECT money, gold, diamond, education_skill FROM users WHERE id = ?';
        db.query(userQuery, [userId], (err, userRes) => {
            if (err || userRes.length === 0) return res.status(500).json({ success: false, message: 'User not found' });
            
            const user = userRes[0];
            const currentLevel = user.education_skill || 1;
            const targetLevel = currentLevel + 1;
            
            if (currentLevel >= 100) return res.json({ success: false, message: 'Maksimum seviyeye ulaşıldı.' });
            
            // Calculate Costs
            let costMoney = Math.floor(1000 * Math.pow(1.1, currentLevel)); // Exponential growth
            let costGold = 0;
            let costDiamond = 0;
            
            if (currentLevel >= 30) costGold = Math.floor((currentLevel - 30) * 5) + 10;
            if (currentLevel >= 60) costDiamond = Math.floor((currentLevel - 60) * 1) + 1;
            
            // Duration (Seconds) - For gameplay, let's say 10 seconds per level base + multiplier
            // Real game might want hours, but for testing/demo:
            const durationSeconds = currentLevel * 10; 
            
            if (user.money < costMoney || user.gold < costGold || (user.diamond || 0) < costDiamond) {
                return res.json({ success: false, message: 'Yetersiz kaynak.' });
            }
            
            const endTime = Date.now() + (durationSeconds * 1000);
            
            // 3. Deduct & Start
            db.beginTransaction(err => {
                if (err) return res.status(500).json({ success: false, message: 'Transaction Error' });
                
                const updateQuery = 'UPDATE users SET money = money - ?, gold = gold - ?, diamond = diamond - ? WHERE id = ?';
                db.query(updateQuery, [costMoney, costGold, costDiamond, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Money Update Error' }));
                    
                    const insertQuery = 'INSERT INTO active_educations (user_id, target_level, start_time, end_time) VALUES (?, ?, ?, ?)';
                    db.query(insertQuery, [userId, targetLevel, Date.now(), endTime], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Insert Error' }));
                        
                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                            
                            // Log it
                            const logMsg = `Eğitim Başlatıldı: Seviye ${targetLevel}`;
                            db.query('INSERT INTO user_logs (user_id, log_type, message) VALUES (?, ?, ?)', [userId, 'EDUCATION_START', logMsg]);
                            
                            res.json({ success: true, endTime, targetLevel });
                        });
                    });
                });
            });
        });
    });
});

// Complete Education
app.post('/api/education/complete', (req, res) => {
    const { userId } = req.body;
    
    const activeQuery = 'SELECT * FROM active_educations WHERE user_id = ?';
    db.query(activeQuery, [userId], (err, activeRes) => {
        if (err) return res.status(500).json({ success: false });
        if (activeRes.length === 0) return res.json({ success: false, message: 'Aktif eğitim yok.' });
        
        const edu = activeRes[0];
        if (Date.now() < edu.end_time) return res.json({ success: false, message: 'Eğitim henüz bitmedi.' });
        
        // Update User
        db.beginTransaction(err => {
            if (err) return res.status(500).json({ success: false });
            
            const updateQuery = 'UPDATE users SET education_skill = ? WHERE id = ?';
            db.query(updateQuery, [edu.target_level, userId], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false }));
                
                const deleteQuery = 'DELETE FROM active_educations WHERE id = ?';
                db.query(deleteQuery, [edu.id], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false }));
                    
                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false }));
                        
                        // Log
                        const logMsg = `Eğitim Tamamlandı! Yeni Seviye: ${edu.target_level}`;
                        db.query('INSERT INTO user_logs (user_id, log_type, message) VALUES (?, ?, ?)', [userId, 'EDUCATION_COMPLETE', logMsg]);
                        
                        res.json({ success: true, newLevel: edu.target_level });
                    });
                });
            });
        });
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
                            let itemKey = mineType;
                            if (itemKey === 'gold') itemKey = 'gold_nugget';

                            const invQuery = `
                                INSERT INTO inventory (user_id, item_key, quantity) 
                                VALUES (?, ?, ?) 
                                ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
                            `;
                            db.query(invQuery, [userId, itemKey, amount], (err) => {
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
        const userQuery = 'SELECT money, gold, diamond, education_skill, license_hospital_level FROM users WHERE id = ?';
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
            const diamondCost = nextLevel >= 5 ? 5 * (nextLevel - 4) : 0;
            
            const userEdu = Number(user.education_skill) || 0;
            const requiredEdu = nextLevel * 10;

            if (userEdu < requiredEdu) {
                return res.json({ success: false, message: `Eğitim seviyeniz yetersiz. Gereken: ${requiredEdu} ve üzeri.` });
            }

            if (user.money < moneyCost || user.gold < goldCost || (user.diamond || 0) < diamondCost) {
                return res.json({ success: false, message: 'Yetersiz bakiye.' });
            }

            db.beginTransaction(err => {
                if (err) return res.status(500).json({ success: false, message: 'İşlem başlatılamadı.' });

                const updateQuery = 'UPDATE users SET money = money - ?, gold = gold - ?, diamond = diamond - ?, license_hospital_level = ? WHERE id = ?';
                db.query(updateQuery, [moneyCost, goldCost, diamondCost, nextLevel, userId], (err) => {
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
        const diamondCost = nextLevel >= 5 ? 5 * (nextLevel - 4) : 0;

        // 3. Check Balance & Education
        const userQuery = 'SELECT money, gold, diamond, education_skill FROM users WHERE id = ?';
        db.query(userQuery, [userId], (err, userRes) => {
            if (err || userRes.length === 0) return res.status(500).json({ success: false, message: 'Kullanıcı bulunamadı.' });
            
            const user = userRes[0];
            const userDiamond = user.diamond || 0;
            const userEdu = Number(user.education_skill) || 0;
            const requiredEdu = nextLevel * 10;

            if (userEdu < requiredEdu) {
                return res.json({ success: false, message: `Eğitim seviyeniz yetersiz. Gereken: ${requiredEdu} ve üzeri.` });
            }

            if (user.money < moneyCost || user.gold < goldCost || userDiamond < diamondCost) {
                return res.json({ success: false, message: 'Yetersiz bakiye.' });
            }

            // 4. Deduct & Update (Transaction)
            db.beginTransaction(err => {
                if (err) return res.status(500).json({ success: false, message: 'İşlem başlatılamadı.' });
                
                const updateBalance = 'UPDATE users SET money = money - ?, gold = gold - ?, diamond = diamond - ? WHERE id = ?';
                db.query(updateBalance, [moneyCost, goldCost, diamondCost, userId], (err) => {
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
                            res.json({ success: true, newLevel: nextLevel, moneyCost, goldCost, diamondCost });
                        });
                    });
                });
            });
        });
    });
});

// --- MINES MANAGEMENT ENDPOINTS ---

const MINE_TYPES = [
    { id: 'wood', name: 'Odun Kampı', reqLevel: 1, costMoney: 1000, costGold: 0, costDiamond: 0 },
    { id: 'stone', name: 'Taş Ocağı', reqLevel: 5, costMoney: 2000, costGold: 0, costDiamond: 0 },
    { id: 'iron', name: 'Demir Madeni', reqLevel: 15, costMoney: 5000, costGold: 10, costDiamond: 0 },
    { id: 'coal', name: 'Kömür Madeni', reqLevel: 20, costMoney: 8000, costGold: 20, costDiamond: 0 },
    { id: 'copper', name: 'Bakır Madeni', reqLevel: 30, costMoney: 10000, costGold: 30, costDiamond: 0 },
    { id: 'gold', name: 'Altın Madeni', reqLevel: 40, costMoney: 25000, costGold: 50, costDiamond: 5 },
    { id: 'oil', name: 'Petrol Kuyusu', reqLevel: 50, costMoney: 15000, costGold: 40, costDiamond: 10 },
    { id: 'uranium', name: 'Uranyum Madeni', reqLevel: 80, costMoney: 50000, costGold: 100, costDiamond: 20 }
];

// Get My Mines
app.get('/api/mines/my/:userId', (req, res) => {
    const userId = req.params.userId;
    db.query('SELECT * FROM player_mines WHERE user_id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Get City Mines
app.get('/api/mines/city', (req, res) => {
    const query = `
        SELECT pm.*, u.username 
        FROM player_mines pm 
        JOIN users u ON pm.user_id = u.id 
        ORDER BY pm.salary DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Buy Mine
app.post('/api/mines/buy', (req, res) => {
    const { userId, mineType } = req.body;
    
    const mineConfig = MINE_TYPES.find(m => m.id === mineType);
    if (!mineConfig) return res.status(400).json({ success: false, message: 'Geçersiz maden tipi.' });

    // 1. Check if user already has this mine type
    db.query('SELECT id FROM player_mines WHERE user_id = ? AND mine_type = ?', [userId, mineType], (err, existing) => {
        if (err) return res.status(500).json({ success: false, message: 'DB Error' });
        if (existing.length > 0) return res.json({ success: false, message: 'Bu maden tipine zaten sahipsin.' });

        // 2. Check User Resources & Requirements
        db.query('SELECT username, money, gold, diamond, education_skill FROM users WHERE id = ?', [userId], (err, users) => {
            if (err || users.length === 0) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
            const user = users[0];

            // Check Skill
            if ((user.education_skill || 1) < mineConfig.reqLevel) {
                return res.json({ success: false, message: `Eğitim seviyen yetersiz. (Gereken: ${mineConfig.reqLevel})` });
            }

            // Check License
            db.query('SELECT level FROM licenses WHERE user_id = ? AND mine_type = ?', [userId, mineType], (err, licenses) => {
                if (err) return res.status(500).json({ success: false, message: 'Lisans kontrol hatası.' });
                if (licenses.length === 0 || licenses[0].level < 1) {
                    return res.json({ success: false, message: 'Bu maden için lisansın yok.' });
                }

                // Check Costs
                if (user.money < mineConfig.costMoney) return res.json({ success: false, message: 'Yetersiz Para.' });
                if (user.gold < mineConfig.costGold) return res.json({ success: false, message: 'Yetersiz Altın.' });
                if ((user.diamond || 0) < mineConfig.costDiamond) return res.json({ success: false, message: 'Yetersiz Elmas.' });

                // 3. Deduct & Create
                db.beginTransaction(err => {
                    if (err) return res.status(500).json({ success: false, message: 'Transaction Error' });

                    const updateQuery = 'UPDATE users SET money = money - ?, gold = gold - ?, diamond = diamond - ? WHERE id = ?';
                    db.query(updateQuery, [mineConfig.costMoney, mineConfig.costGold, mineConfig.costDiamond, userId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Bakiye düşülemedi.' }));

                        const mineName = `${user.username}'s ${mineConfig.name}`;
                        const insertQuery = 'INSERT INTO player_mines (user_id, mine_type, name, level, reserve) VALUES (?, ?, ?, 1, 10000)';
                        db.query(insertQuery, [userId, mineType, mineName], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Maden oluşturulamadı.' }));

                            db.commit(err => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                                res.json({ success: true, message: 'Maden başarıyla satın alındı!' });
                            });
                        });
                    });
                });
            });
        });
    });
});

// --- MINE MANAGEMENT DETAILS ---

// Mine Details
app.get('/api/mines/detail/:id', (req, res) => {
    const mineId = req.params.id;
    const userId = req.query.userId || 0;
    console.log('Requesting mine detail for ID:', mineId, 'User:', userId);

    // Cleanup old workers first (Only delete if stale for > 1 hour to allow collection)
    db.query('DELETE FROM mine_active_workers WHERE end_time < DATE_SUB(NOW(), INTERVAL 1 HOUR)', (err) => {
        if (err) console.error('Cleanup Error:', err);

        db.query('SELECT m.*, m.user_id as owner_id, u.username as owner_name FROM player_mines m LEFT JOIN users u ON m.user_id = u.id WHERE m.id = ?', [mineId], (err, results) => {
            if (err) {
                console.error('DB Error in mine detail:', err);
                return res.status(500).json({ success: false, message: 'DB Error' });
            }
            console.log('Mine detail results:', results);
            if (results.length === 0) return res.status(404).json({ success: false, message: 'Maden bulunamadı.' });
            
            const mine = results[0];

            // Fetch AR-GE Level
            const argeQuery = 'SELECT level FROM arge_levels WHERE user_id = ? AND mine_type = ?';
            db.query(argeQuery, [mine.owner_id, mine.mine_type], (err, argeRes) => {
                const argeLevel = (argeRes && argeRes.length > 0) ? argeRes[0].level : 1;
                
                // Calculate Chance
                const baseChance = 30;
                const chanceIncrease = (argeLevel - 1) * 5;
                const totalChance = Math.min(baseChance + chanceIncrease, 75);

                // Get Logs
                const logQuery = `
                    SELECT ml.*, u.username 
                    FROM mine_logs ml 
                    JOIN users u ON ml.user_id = u.id 
                    WHERE ml.mine_id = ? 
                    ORDER BY ml.created_at DESC 
                    LIMIT 10
                `;

                db.query(logQuery, [mineId], (err, logs) => {
                    if (err) {
                        console.error('Logs Query Error:', err);
                        return res.status(500).json({ success: false, message: 'Logs Error' });
                    }

                    // Get Active Workers (Active OR Current User's Pending)
                    const workersQuery = `
                        SELECT maw.*, u.username 
                        FROM mine_active_workers maw 
                        JOIN users u ON maw.user_id = u.id 
                        WHERE maw.mine_id = ? AND (maw.end_time > NOW() OR maw.user_id = ?)
                    `;
                    
                    db.query(workersQuery, [mineId, userId], (err, workers) => {
                        if (err) {
                            console.error('Workers Query Error:', err);
                            return res.status(500).json({ success: false, message: 'Workers Error' });
                        }
                        
                        // Add calculated fields to mine object
                        mine.arge_level = argeLevel;
                        mine.efficiency = totalChance;

                        res.json({ success: true, mine, logs, workers });
                    });
                });
            });
        });
    });
});

// Update Mine Settings
app.post('/api/mines/update/:id', (req, res) => {
    const mineId = req.params.id;
    const { name, salary } = req.body;
    
    db.query('UPDATE player_mines SET name = ?, salary = ? WHERE id = ?', [name, salary, mineId], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Güncelleme hatası.' });
        res.json({ success: true, message: 'Ayarlar güncellendi.' });
    });
});

// Deposit Money
app.post('/api/mines/deposit/:id', (req, res) => {
    const mineId = req.params.id;
    const { userId, amount } = req.body;
    
    if (amount <= 0) return res.json({ success: false, message: 'Geçersiz miktar.' });

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction Error' });

        db.query('SELECT money FROM users WHERE id = ?', [userId], (err, users) => {
            if (err || users.length === 0) return db.rollback(() => res.status(500).json({ success: false, message: 'Kullanıcı bulunamadı.' }));
            if (users[0].money < amount) return db.rollback(() => res.json({ success: false, message: 'Yetersiz bakiye.' }));

            db.query('UPDATE users SET money = money - ? WHERE id = ?', [amount, userId], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Para çekilemedi.' }));

                db.query('UPDATE player_mines SET vault = vault + ? WHERE id = ?', [amount, mineId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Kasa güncellenemedi.' }));

                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                        res.json({ success: true, message: 'Para yatırıldı.' });
                    });
                });
            });
        });
    });
});

// Withdraw Stock (Collect Resources)
app.post('/api/mines/withdraw/:id', (req, res) => {
    const mineId = req.params.id;
    const { userId } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction Error' });

        db.query('SELECT * FROM player_mines WHERE id = ?', [mineId], (err, mines) => {
            if (err || mines.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Maden bulunamadı.' }));
            const mine = mines[0];
            
            if (mine.stock <= 0) return db.rollback(() => res.json({ success: false, message: 'Depo boş.' }));
            
            const amount = mine.stock;
            let itemKey = mine.mine_type; // e.g. 'wood', 'stone'
            
            // Special case for Gold Mine -> Gold Nugget
            if (itemKey === 'gold') {
                itemKey = 'gold_nugget';
            }

            // Add to Inventory
            const invQuery = `
                INSERT INTO inventory (user_id, item_key, quantity) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
            `;
            db.query(invQuery, [userId, itemKey, amount], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Envanter hatası.' }));

                // Clear Stock
                db.query('UPDATE player_mines SET stock = 0 WHERE id = ?', [mineId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Stok sıfırlanamadı.' }));

                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                        res.json({ success: true, message: `${amount} adet ürün envantere eklendi.` });
                    });
                });
            });
        });
    });
});

// Research Reserve
app.post('/api/mines/research/:id', (req, res) => {
    const mineId = req.params.id;
    const { userId } = req.body;
    const COST = 5000;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction Error' });

        db.query('SELECT money FROM users WHERE id = ?', [userId], (err, users) => {
            if (err || users.length === 0) return db.rollback(() => res.status(500).json({ success: false, message: 'User Error' }));
            if (users[0].money < COST) return db.rollback(() => res.json({ success: false, message: 'Yetersiz bakiye.' }));

            db.query('SELECT level FROM player_mines WHERE id = ?', [mineId], (err, mines) => {
                if (err || mines.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Maden bulunamadı.' }));
                const level = mines[0].level;
                const capacity = level * 10000;

                db.query('UPDATE users SET money = money - ? WHERE id = ?', [COST, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Para düşülemedi.' }));

                    // Add Reserve (Random 30% - 100% of Capacity)
                    const minAdd = Math.floor(capacity * 0.3);
                    const maxAdd = capacity;
                    const addedReserve = Math.floor(Math.random() * (maxAdd - minAdd + 1)) + minAdd;

                    db.query('UPDATE player_mines SET reserve = LEAST(?, reserve + ?) WHERE id = ?', [capacity, addedReserve, mineId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Rezerv güncellenemedi.' }));

                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                            res.json({ success: true, message: `Rezerv +${addedReserve} arttırıldı.` });
                        });
                    });
                });
            });
        });
    });
});

// Upgrade Mine
app.post('/api/mines/upgrade/:id', (req, res) => {
    const mineId = req.params.id;
    const { userId } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction Error' });

        db.query('SELECT * FROM player_mines WHERE id = ?', [mineId], (err, mines) => {
            if (err || mines.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Maden bulunamadı.' }));
            const mine = mines[0];
            
            const nextLevel = mine.level + 1;
            const costMoney = nextLevel * 5000;
            const costGold = nextLevel > 5 ? (nextLevel - 5) * 10 : 0;

            db.query('SELECT money, gold FROM users WHERE id = ?', [userId], (err, users) => {
                if (err || users.length === 0) return db.rollback(() => res.status(500).json({ success: false, message: 'User Error' }));
                const user = users[0];

                if (user.money < costMoney || user.gold < costGold) {
                    return db.rollback(() => res.json({ success: false, message: 'Yetersiz kaynak.' }));
                }

                db.query('UPDATE users SET money = money - ?, gold = gold - ? WHERE id = ?', [costMoney, costGold, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Kaynak düşülemedi.' }));

                    db.query('UPDATE player_mines SET level = level + 1 WHERE id = ?', [mineId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Seviye arttırılamadı.' }));

                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                            res.json({ success: true, message: `Maden Seviye ${nextLevel} oldu!` });
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
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Güncelleme hatası.' }));

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
            // Diamond cost could be added here too

            // Check User Resources
            db.query('SELECT money, gold FROM users WHERE id = ?', [userId], (err, users) => {
                if (err || users.length === 0) return db.rollback(() => res.status(500).json({ success: false, message: 'User Error' }));
                const user = users[0];

                if (user.money < costMoney || user.gold < costGold) {
                    return db.rollback(() => res.json({ success: false, message: 'Yetersiz kaynak.' }));
                }

                // Deduct Resources
                db.query('UPDATE users SET money = money - ?, gold = gold - ? WHERE id = ?', [costMoney, costGold, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Resource Update Error' }));

                    // Upgrade Mine
                    db.query('UPDATE hospitals SET level = level + 1 WHERE id = ?', [mineId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Upgrade Error' }));

                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                            res.json({ success: true, message: 'Maden seviyesi yükseltildi!' });
                        });
                    });
                });
            });
        });
    });
});

// --- DAILY JOBS SYSTEM ---

// Get All Jobs
app.get('/api/daily-jobs', (req, res) => {
    db.query('SELECT * FROM daily_jobs ORDER BY minLevel ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        
        // Map DB columns to frontend expected format
        const jobs = results.map(job => ({
            id: job.id,
            name: job.name,
            icon: job.icon,
            time: job.time,
            minLevel: job.minLevel,
            costH: job.costH,
            costE: job.costE,
            reward: {
                money: job.reward_money,
                xp: job.reward_xp,
                gold: job.reward_gold,
                diamond: job.reward_diamond
            }
        }));
        res.json(jobs);
    });
});

// Get Job Status
app.get('/api/daily-jobs/status/:userId', (req, res) => {
    const { userId } = req.params;
    
    // 1. Get Completed Jobs for Today
    const today = new Date().toISOString().split('T')[0];
    db.query('SELECT job_id FROM completed_daily_jobs WHERE user_id = ? AND completed_at = ?', [userId, today], (err, completed) => {
        if (err) return res.status(500).json({ success: false, error: err });
        
        const completedIds = completed.map(c => c.job_id);

        // 2. Get Active Job
        db.query('SELECT * FROM active_daily_jobs WHERE user_id = ?', [userId], (err, active) => {
            if (err) return res.status(500).json({ success: false, error: err });
            
            let activeJobData = null;
            if (active.length > 0) {
                const aj = active[0];
                const now = new Date();
                const end = new Date(aj.end_time);
                const remaining = Math.max(0, (end - now) / 1000); // seconds

                // Get Job Name
                db.query('SELECT name, time FROM daily_jobs WHERE id = ?', [aj.job_id], (err, jobInfo) => {
                    if (!err && jobInfo.length > 0) {
                        activeJobData = {
                            job_id: aj.job_id,
                            name: jobInfo[0].name,
                            totalTime: jobInfo[0].time,
                            remainingTime: remaining
                        };
                    }
                    res.json({ success: true, completedJobs: completedIds, activeJob: activeJobData });
                });
            } else {
                res.json({ success: true, completedJobs: completedIds, activeJob: null });
            }
        });
    });
});

// Start Job
app.post('/api/daily-jobs/start', (req, res) => {
    const { userId, jobId } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // 1. Check Active Job
        db.query('SELECT id FROM active_daily_jobs WHERE user_id = ?', [userId], (err, active) => {
            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'DB Error' }));
            if (active.length > 0) return db.rollback(() => res.json({ success: false, message: 'Zaten bir işte çalışıyorsun.' }));

            // 2. Check Completed Today
            const today = new Date().toISOString().split('T')[0];
            db.query('SELECT id FROM completed_daily_jobs WHERE user_id = ? AND job_id = ? AND completed_at = ?', [userId, jobId, today], (err, completed) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'DB Error' }));
                if (completed.length > 0) return db.rollback(() => res.json({ success: false, message: 'Bu işi bugün zaten yaptın.' }));

                // 3. Get Job Info & User Info
                db.query('SELECT * FROM daily_jobs WHERE id = ?', [jobId], (err, jobs) => {
                    if (err || jobs.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'İş bulunamadı.' }));
                    const job = jobs[0];

                    db.query('SELECT health, energy, level FROM users WHERE id = ?', [userId], (err, users) => {
                        if (err || users.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' }));
                        const user = users[0];

                        // Checks
                        if (user.level < job.minLevel) return db.rollback(() => res.json({ success: false, message: 'Seviyen yetersiz.' }));
                        if (user.health < job.costH) return db.rollback(() => res.json({ success: false, message: 'Sağlığın yetersiz.' }));
                        if (user.energy < job.costE) return db.rollback(() => res.json({ success: false, message: 'Enerjin yetersiz.' }));

                        // 4. Deduct Stats
                        db.query('UPDATE users SET health = health - ?, energy = energy - ? WHERE id = ?', [job.costH, job.costE, userId], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'User update error' }));

                            // 5. Start Job
                            const endTime = new Date(Date.now() + job.time * 1000);
                            db.query('INSERT INTO active_daily_jobs (user_id, job_id, end_time) VALUES (?, ?, ?)', [userId, jobId, endTime], (err) => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Start job error' }));

                                db.commit(err => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                                    
                                    // Return new stats
                                    res.json({ 
                                        success: true, 
                                        message: 'İşe başladın!', 
                                        newStats: { health: user.health - job.costH, energy: user.energy - job.costE }
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

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // 1. Check Active Job
        db.query('SELECT * FROM active_daily_jobs WHERE user_id = ? AND job_id = ?', [userId, jobId], (err, active) => {
            if (err || active.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Aktif iş bulunamadı.' }));
            
            const aj = active[0];
            if (new Date() < new Date(aj.end_time)) return db.rollback(() => res.json({ success: false, message: 'İş henüz bitmedi.' }));

            // 2. Get Job Rewards
            db.query('SELECT * FROM daily_jobs WHERE id = ?', [jobId], (err, jobs) => {
                if (err || jobs.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'İş tanımı bulunamadı.' }));
                const job = jobs[0];

                // 3. Give Rewards
                const q = 'UPDATE users SET money = money + ?, xp = xp + ?, gold = gold + ?, diamond = diamond + ? WHERE id = ?';
                db.query(q, [job.reward_money, job.reward_xp, job.reward_gold, job.reward_diamond, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Reward error' }));

                    // 4. Remove Active Job
                    db.query('DELETE FROM active_daily_jobs WHERE id = ?', [aj.id], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Delete active error' }));

                        // 5. Add to Completed
                        const today = new Date().toISOString().split('T')[0];
                        db.query('INSERT INTO completed_daily_jobs (user_id, job_id, completed_at) VALUES (?, ?, ?)', [userId, jobId, today], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Log completed error' }));

                            // Get Updated User Stats
                            db.query('SELECT money, xp, gold, diamond, level FROM users WHERE id = ?', [userId], (err, users) => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Get stats error' }));
                                
                                db.commit(err => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                                    res.json({ success: true, message: 'İş tamamlandı!', newStats: users[0] });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});




// --- ADMIN PANEL ENDPOINTS ---

// Get All Users
app.get('/api/admin/users', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Update User
app.post('/api/admin/update-user', (req, res) => {
    const { id, money, gold, diamond, energy, health, level } = req.body;
    
    const query = 'UPDATE users SET money = ?, gold = ?, diamond = ?, energy = ?, health = ?, level = ? WHERE id = ?';
    db.query(query, [money, gold, diamond, energy, health, level, id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true });
    });
});

// Get Full User Details (Admin)
app.get('/api/admin/user-details/:id', (req, res) => {
    const userId = req.params.id;
    
    const queries = {
        user: 'SELECT * FROM users WHERE id = ?',
        inventory: 'SELECT * FROM inventory WHERE user_id = ?',
        mines: 'SELECT * FROM player_mines WHERE user_id = ?',
        licenses: 'SELECT * FROM licenses WHERE user_id = ?',
        education: 'SELECT * FROM active_educations WHERE user_id = ?'
    };

    db.query(queries.user, [userId], (err, userRes) => {
        if (err) return res.status(500).json({ error: err });
        if (userRes.length === 0) return res.status(404).json({ message: 'User not found' });

        const userData = userRes[0];

        db.query(queries.inventory, [userId], (err, invRes) => {
            if (err) return res.status(500).json({ error: err });
            
            db.query(queries.mines, [userId], (err, minesRes) => {
                if (err) return res.status(500).json({ error: err });

                db.query(queries.licenses, [userId], (err, licRes) => {
                    if (err) return res.status(500).json({ error: err });

                    db.query(queries.education, [userId], (err, eduRes) => {
                        if (err) return res.status(500).json({ error: err });

                        res.json({
                            user: userData,
                            inventory: invRes,
                            mines: minesRes,
                            licenses: licRes,
                            activeEducation: eduRes[0] || null
                        });
                    });
                });
            });
        });
    });
});

// --- EDUCATION & MINING LOGIC ---

const EDUCATION_TIERS = [
    { name: 'İlkokul', min: 1, max: 10 },
    { name: 'Ortaokul', min: 11, max: 20 },
    { name: 'Lise', min: 21, max: 30 },
    { name: 'Önlisans', min: 31, max: 40 },
    { name: 'Lisans', min: 41, max: 50 },
    { name: 'Yüksek Lisans', min: 51, max: 60 },
    { name: 'Doktora', min: 61, max: 70 },
    { name: 'Post-Doc', min: 71, max: 80 },
    { name: 'Doçent', min: 81, max: 90 },
    { name: 'Profesör', min: 91, max: 100 }
];

function getBaseProductionRange(skillLevel) {
    if (skillLevel <= 10) return { min: 1, max: 3 };
    if (skillLevel <= 20) return { min: 2, max: 5 };
    if (skillLevel <= 30) return { min: 4, max: 7 };
    if (skillLevel <= 40) return { min: 6, max: 9 };
    if (skillLevel <= 50) return { min: 8, max: 12 };
    if (skillLevel <= 60) return { min: 10, max: 14 };
    if (skillLevel <= 70) return { min: 12, max: 17 };
    if (skillLevel <= 80) return { min: 15, max: 20 };
    if (skillLevel <= 90) return { min: 18, max: 23 };
    return { min: 20, max: 25 };
}

// Start Working on a Mine
app.post('/api/mines/start', (req, res) => {
    const { userId, mineId } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // 1. Get User & Mine Data
        // Only count workers whose end_time is in the future
        const query = `
            SELECT u.energy, u.health, u.education_skill, m.id as mine_id, m.max_workers, m.reserve, m.salary, m.vault, m.mine_type, m.stock, m.level, m.user_id as owner_id,
            (SELECT level FROM arge_levels WHERE user_id = m.user_id AND mine_type = m.mine_type) as arge_level,
            (SELECT COUNT(*) FROM mine_active_workers WHERE mine_id = m.id AND end_time > NOW()) as current_workers,
            (SELECT COUNT(*) FROM mine_active_workers WHERE user_id = ? AND end_time > NOW()) as any_active_workers
            FROM users u, player_mines m
            WHERE u.id = ? AND m.id = ?
        `;

        db.query(query, [userId, userId, mineId], (err, results) => {
            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'DB Error' }));
            if (results.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Kullanıcı veya Maden bulunamadı.' }));

            const data = results[0];
            const { energy, health, education_skill, max_workers, current_workers, any_active_workers, reserve, salary, vault, arge_level, stock, level } = data;

            // 2. Checks
            const ENERGY_COST = 10;
            const HEALTH_COST = 5;
            const MAX_STOCK = level * 1000; // Depo Kapasitesi: Level * 1000

            if (any_active_workers > 0) return db.rollback(() => res.json({ success: false, message: 'Zaten bir işte çalışıyorsun! Önce onu tamamla.' }));
            if (energy < ENERGY_COST) return db.rollback(() => res.json({ success: false, message: 'Yetersiz Enerji!' }));
            if (health < HEALTH_COST) return db.rollback(() => res.json({ success: false, message: 'Sağlığın çok düşük!' }));
            if (reserve <= 0) return db.rollback(() => res.json({ success: false, message: 'Maden rezervi tükenmiş!' }));
            if (stock >= MAX_STOCK) return db.rollback(() => res.json({ success: false, message: 'Maden deposu dolu! Üretim yapılamaz.' }));
            
            // Vault Check (Estimated Max Cost)
            const userSkill = education_skill || 1;
            const { max } = getBaseProductionRange(userSkill);
            const currentArge = arge_level || 1;
            const multiplier = 1.0 + (currentArge - 1) * 0.1;
            const maxProduction = Math.ceil(max * multiplier);
            const estimatedCost = maxProduction * salary;

            if (vault < estimatedCost) {
                return db.rollback(() => res.json({ success: false, message: 'Maden kasasında maaş için yeterli bakiye yok!' }));
            }

            // Capacity Check
            if (current_workers >= (max_workers || 5)) {
                return db.rollback(() => res.json({ success: false, message: 'Maden kapasitesi dolu! (' + current_workers + '/' + (max_workers || 5) + ')' }));
            }

            // 3. Deduct Energy/Health
            db.query('UPDATE users SET energy = energy - ?, health = health - ? WHERE id = ?', [ENERGY_COST, HEALTH_COST, userId], (err) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'User Update Error' }));

                // 4. Add to Active Workers (Duration: 1 minute)
                const WORK_DURATION_MINUTES = 1;
                const endTime = new Date(Date.now() + WORK_DURATION_MINUTES * 60000);
                
                db.query('INSERT INTO mine_active_workers (mine_id, user_id, end_time) VALUES (?, ?, ?)', [mineId, userId, endTime], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Active Worker Error' }));

                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                        
                        res.json({ 
                            success: true, 
                            message: 'Çalışma başladı! 1 dakika sonra üretimi toplayabilirsin.',
                            newEnergy: energy - ENERGY_COST,
                            newHealth: health - HEALTH_COST,
                            workEndTime: endTime
                        });
                    });
                });
            });
        });
    });
});

// Collect Reward from Mine
app.post('/api/mines/collect', (req, res) => {
    const { userId, mineId } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // 1. Check Active Worker
        db.query('SELECT * FROM mine_active_workers WHERE user_id = ? AND mine_id = ?', [userId, mineId], (err, workers) => {
            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'DB Error' }));
            if (workers.length === 0) return db.rollback(() => res.json({ success: false, message: 'Aktif çalışma bulunamadı.' }));

            const worker = workers[0];
            if (new Date() < new Date(worker.end_time)) {
                return db.rollback(() => res.json({ success: false, message: 'Çalışma henüz bitmedi!' }));
            }

            // 2. Get User & Mine Data
            const query = `
                SELECT u.education_skill, m.id as mine_id, m.user_id as owner_id, m.level, m.salary, m.vault, m.reserve, m.mine_type,
                (SELECT level FROM arge_levels WHERE user_id = m.user_id AND mine_type = m.mine_type) as arge_level
                FROM users u, player_mines m
                WHERE u.id = ? AND m.id = ?
            `;

            db.query(query, [userId, mineId], (err, results) => {
                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'DB Error' }));
                if (results.length === 0) return db.rollback(() => res.status(404).json({ success: false, message: 'Veri bulunamadı.' }));

                const data = results[0];
                const { education_skill, owner_id, level, salary, vault, reserve, arge_level } = data;

                // 3. Calculate Production based on Education & AR-GE
                const userSkill = education_skill || 1;
                const { min, max } = getBaseProductionRange(userSkill);
                const baseAmount = Math.floor(Math.random() * (max - min + 1)) + min;
                
                // AR-GE Multiplier
                const currentArge = arge_level || 1;
                const multiplier = 1.0 + (currentArge - 1) * 0.1;
                
                const amount = Math.round(baseAmount * multiplier);
                
                // 4. Calculate Earnings
                const totalEarnings = amount * salary;
                // const isOwner = (userId == owner_id); // Removed owner check for salary
                
                // Check vault for everyone (including owner)
                if (vault < totalEarnings) {
                    return db.rollback(() => res.json({ success: false, message: 'Maden kasasında yeterli para yok!' }));
                }

                // 5. Updates
                const userMoneyChange = totalEarnings;
                const vaultChange = -totalEarnings;

                // Update User Money
                db.query('UPDATE users SET money = money + ? WHERE id = ?', [userMoneyChange, userId], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'User Update Error' }));

                    // Update Mine (Stock, Reserve, Vault)
                    db.query('UPDATE player_mines SET stock = stock + ?, reserve = GREATEST(0, reserve - ?), vault = vault + ? WHERE id = ?', 
                        [amount, amount, vaultChange, mineId], (err) => {
                        if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Mine Update Error' }));

                        // Log Transaction
                        const logQuery = 'INSERT INTO mine_logs (mine_id, user_id, amount, earnings) VALUES (?, ?, ?, ?)';
                        db.query(logQuery, [mineId, userId, amount, totalEarnings], (err) => {
                            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Log Error' }));

                            // Remove Active Worker
                            db.query('DELETE FROM mine_active_workers WHERE id = ?', [worker.id], (err) => {
                                if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Delete Worker Error' }));

                                db.commit(err => {
                                    if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit Error' }));
                                    
                                    res.json({ 
                                        success: true, 
                                        message: `Üretim Tamamlandı! +${amount} Üretim, +${totalEarnings} ₺ Kazanç.`,
                                        amount: amount,
                                        salary: totalEarnings,
                                        newReserve: Math.max(0, reserve - amount)
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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

