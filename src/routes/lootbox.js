const express = require("express");
const router = express.Router();

module.exports = function(db) {

// Get User Keys
router.get("/keys/:userId", (req, res) => {
    const userId = req.params.userId;
    db.query("SELECT item_key, quantity FROM inventory WHERE user_id = ? AND item_key IN (?, ?, ?, ?)", 
        [userId, "key_common", "key_rare", "key_mystic", "key_epic"], 
        (err, results) => {
            if (err) return res.status(500).json({ success: false, message: "DB Error" });
            
            const keys = {
                common: 0,
                rare: 0,
                mystic: 0,
                epic: 0
            };
            
            if (results) {
                results.forEach(row => {
                    if(row.item_key === "key_common") keys.common = row.quantity;
                    if(row.item_key === "key_rare") keys.rare = row.quantity;
                    if(row.item_key === "key_mystic") keys.mystic = row.quantity;
                    if(row.item_key === "key_epic") keys.epic = row.quantity;
                });
            }
            
            res.json({ success: true, keys });
        }
    );
});

// Open Loot Box
router.post("/open", (req, res) => {
    const { userId, boxType } = req.body;
    
    const keyMap = {
        "common": "key_common",
        "rare": "key_rare",
        "mystic": "key_mystic",
        "epic": "key_epic"
    };
    
    const requiredKey = keyMap[boxType];
    if (!requiredKey) return res.json({ success: false, message: "Geçersiz kutu tipi." });
    
    db.beginTransaction(err => {
        if (err) return res.json({ success: false, message: "Transaction error" });
        
        // Check and Consume Key
        db.query("SELECT quantity FROM inventory WHERE user_id = ? AND item_key = ? FOR UPDATE", [userId, requiredKey], (err, inv) => {
            if (err) return db.rollback(() => res.json({ success: false, message: "DB Error" }));
            
            if (!inv.length || inv[0].quantity < 1) {
                return db.rollback(() => res.json({ success: false, message: "Anahtar yok!" }));
            }
            
            db.query("UPDATE inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_key = ?", [userId, requiredKey], (err) => {
                if (err) return db.rollback(() => res.json({ success: false, message: "DB Error Remove Key" }));
                
                // --- REWARD GENERATION LOGIC ---
                const rewards = [];
                const rewardCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 items
                
                for(let i=0; i<rewardCount; i++) {
                    const rand = Math.random() * 100;
                    let type = 'item';
                    let key = '';
                    let amount = 0;
                    let name = '';

                    if (boxType === "common") {
                        if (rand < 40) { // Money
                            type = 'money';
                            amount = Math.floor(Math.random() * 2000) + 500;
                            name = 'Para';
                        } else if (rand < 70) { // Food & Basics
                            const items = ["wheat", "tomato", "corn", "bread"];
                            key = items[Math.floor(Math.random() * items.length)];
                            amount = Math.floor(Math.random() * 30) + 10;
                        } else { // Raw Materials
                            const items = ["stone", "coal", "sand", "wood", "iron_ore"];
                            key = items[Math.floor(Math.random() * items.length)];
                            amount = Math.floor(Math.random() * 20) + 5;
                        }
                    } else if (boxType === "rare") {
                        if (rand < 30) { // Money
                            type = 'money';
                            amount = Math.floor(Math.random() * 15000) + 5000;
                            name = 'Para';
                        } else if (rand < 60) { // Processed Med Tier
                            const items = ["lumber", "glass", "brick", "flour", "textile"];
                            key = items[Math.floor(Math.random() * items.length)];
                            amount = Math.floor(Math.random() * 15) + 5;
                        } else { // Valuable Raw
                            const items = ["gold_ore", "copper", "oil", "steel"];
                            key = items[Math.floor(Math.random() * items.length)];
                            amount = Math.floor(Math.random() * 10) + 2;
                        }
                    } else if (boxType === "mystic") {
                        if (rand < 30) { // High Money
                            type = 'money';
                            amount = Math.floor(Math.random() * 40000) + 10000;
                            name = 'Para';
                        } else if (rand < 60) { // Advanced Materials
                            const items = ["electronics", "engine", "plastic", "concrete", "fuel"];
                            key = items[Math.floor(Math.random() * items.length)];
                            amount = Math.floor(Math.random() * 15) + 5;
                        } else { // Rare Resources
                            const items = ["gold", "titanium", "uranium"];
                            key = items[Math.floor(Math.random() * items.length)];
                            amount = Math.floor(Math.random() * 8) + 2;
                        }
                    } else if (boxType === "epic") {
                         if (rand < 25) { // Very High Money
                            type = 'money';
                            amount = Math.floor(Math.random() * 100000) + 25000;
                            name = 'Para';
                        } else if (rand < 55) { // Luxury / Top Tier
                            const items = ["diamond", "gold_nugget", "jewelry", "arms"];
                            key = items[Math.floor(Math.random() * items.length)];
                            amount = Math.floor(Math.random() * 5) + 1;
                        } else { // Bulk Advanced
                             const items = ["concrete", "steel", "oil", "electronics"];
                             key = items[Math.floor(Math.random() * items.length)];
                             amount = Math.floor(Math.random() * 50) + 20;
                        }
                    }
                    
                    if (type === 'item' && !name) {
                        // Simple capitalization for name
                        name = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    }
                    
                    rewards.push({ type, key, amount, name });
                }
                
                // Consolidate duplicate rewards (e.g. 2 stacks of Money)
                const consolidated = [];
                rewards.forEach(r => {
                    const existing = consolidated.find(c => c.type === r.type && c.key === r.key);
                    if (existing) {
                        existing.amount += r.amount;
                    } else {
                        consolidated.push(r);
                    }
                });
                
                // Apply Rewards to DB
                // We use a promise chain or async/await pattern workaround for callbacks here
                
                const processRewards = async () => {
                    try {
                        for (const reward of consolidated) {
                            if (reward.type === 'money') {
                                await new Promise((resolve, reject) => {
                                    db.query("UPDATE users SET money = money + ? WHERE id = ?", [reward.amount, userId], (err) => {
                                        if (err) reject(err); else resolve();
                                    });
                                });
                            } else {
                                await new Promise((resolve, reject) => {
                                    db.query("INSERT INTO inventory (user_id, item_key, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?", 
                                    [userId, reward.key, reward.amount, reward.amount], (err) => {
                                        if (err) reject(err); else resolve();
                                    });
                                });
                            }
                        }
                        
                        db.commit(() => {
                             res.json({ success: true, rewards: consolidated });
                        });
                        
                    } catch (err) {
                        db.rollback(() => res.json({ success: false, message: "Reward Distribution Error" }));
                    }
                };
                
                processRewards();
            });
        });
    });
});

return router;
};

