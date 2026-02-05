const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // GET Market Stats (Counts per item)
    router.get('/stats', (req, res) => {
        const query = `
            SELECT item_key, COUNT(*) as count 
            FROM market_listings 
            GROUP BY item_key
        `;
        db.query(query, (err, results) => {
            if (err) {
                console.error("Market Stats Error:", err);
                return res.status(500).json({});
            }
            
            // Convert to object: { 'iron': 5, 'gold': 2 }
            const stats = {};
            results.forEach(row => {
                stats[row.item_key] = row.count;
            });
            
            res.json(stats);
        });
    });

    // GET Listings for an item
    router.get('/:itemId', (req, res) => {
        const itemId = req.params.itemId;
        const sort = req.query.sort === 'desc' ? 'DESC' : 'ASC';

        const query = `
            SELECT m.*, u.username as seller_name, u.avatar as seller_avatar 
            FROM market_listings m
            JOIN users u ON m.seller_id = u.id
            WHERE m.item_key = ? AND m.quantity > 0
            ORDER BY m.price ${sort}
        `;

        db.query(query, [itemId], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            res.json({ success: true, listings: results });
        });
    });

    // POST Sell Item
    router.post('/sell', (req, res) => {
        const { sellerId, itemId, price, quantity } = req.body;

        if (!sellerId || !itemId || !price || !quantity) {
            return res.status(400).json({ success: false, message: 'Eksik veri.' });
        }

        // 1. Check User Inventory
        const checkInv = `SELECT quantity FROM inventory WHERE user_id = ? AND item_key = ?`;
        db.query(checkInv, [sellerId, itemId], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: 'DB Error' });
            
            if (results.length === 0 || results[0].quantity < quantity) {
                return res.status(400).json({ success: false, message: 'Yetersiz stok.' });
            }

            // 2. Deduct from inventory
            const updateInv = `UPDATE inventory SET quantity = quantity - ? WHERE user_id = ? AND item_key = ?`;
            db.query(updateInv, [quantity, sellerId, itemId], (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Inventory Error' });

                // 3. Create Listing
                const insertListing = `INSERT INTO market_listings (seller_id, item_key, price, quantity) VALUES (?, ?, ?, ?)`;
                db.query(insertListing, [sellerId, itemId, price, quantity], (err) => {
                    if (err) return res.status(500).json({ success: false, message: 'Listing Error' });
                    res.json({ success: true, message: 'İlan oluşturuldu.' });
                });
            });
        });
    });

    // POST Buy Item
    router.post('/buy', (req, res) => {
        const { buyerId, listingId, quantity } = req.body;

        db.beginTransaction((err) => {
            if (err) return res.status(500).json({ success: false, message: 'Transaction Error' });

            // 1. Get Listing
            const getListing = `SELECT * FROM market_listings WHERE id = ? FOR UPDATE`;
            db.query(getListing, [listingId], (err, results) => {
                if (err || results.length === 0) {
                    return db.rollback(() => res.status(404).json({ success: false, message: 'İlan bulunamadı.' }));
                }

                const listing = results[0];
                if (listing.quantity < quantity) {
                    return db.rollback(() => res.status(400).json({ success: false, message: 'Yetersiz stok.' }));
                }

                if (listing.seller_id == buyerId) {
                     return db.rollback(() => res.status(400).json({ success: false, message: 'Kendi ürününü alamazsın.' }));
                }

                const totalCost = listing.price * quantity;

                // 2. Check Buyer Money
                const checkMoney = `SELECT money FROM users WHERE id = ?`;
                db.query(checkMoney, [buyerId], (err, users) => {
                    if (err || users.length === 0) return db.rollback(() => res.status(500).json({ success: false }));
                    
                    if (users[0].money < totalCost) {
                        return db.rollback(() => res.status(400).json({ success: false, message: 'Yetersiz bakiye.' }));
                    }

                    // 3. Process Transaction
                    // 3a. Deduct Money from Buyer
                    db.query('UPDATE users SET money = money - ? WHERE id = ?', [totalCost, buyerId], (err) => {
                        if (err) return db.rollback(() => res.status(500));

                        // 3b. Add Money to Seller
                        db.query('UPDATE users SET money = money + ? WHERE id = ?', [totalCost, listing.seller_id], (err) => {
                            if (err) return db.rollback(() => res.status(500));

                            // 3c. Add Item to Buyer Inventory
                            // Check if exists first
                            db.query('SELECT * FROM inventory WHERE user_id = ? AND item_key = ?', [buyerId, listing.item_key], (err, inv) => {
                                if (err) return db.rollback(() => res.status(500));

                                let invQuery = '';
                                let invParams = [];

                                if (inv.length > 0) {
                                    invQuery = 'UPDATE inventory SET quantity = quantity + ? WHERE user_id = ? AND item_key = ?';
                                    invParams = [quantity, buyerId, listing.item_key];
                                } else {
                                    invQuery = 'INSERT INTO inventory (user_id, item_key, quantity) VALUES (?, ?, ?)';
                                    invParams = [buyerId, listing.item_key, quantity];
                                }

                                db.query(invQuery, invParams, (err) => {
                                    if (err) return db.rollback(() => res.status(500));

                                    // 3d. Update Listing Quantity
                                    const newQty = listing.quantity - quantity;
                                    if (newQty <= 0) {
                                        db.query('DELETE FROM market_listings WHERE id = ?', [listingId], (err) => {
                                             if (err) return db.rollback(() => res.status(500));
                                             db.commit(() => res.json({ success: true }));
                                        });
                                    } else {
                                        db.query('UPDATE market_listings SET quantity = ? WHERE id = ?', [newQty, listingId], (err) => {
                                             if (err) return db.rollback(() => res.status(500));
                                             db.commit(() => res.json({ success: true }));
                                        });
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    // --- AUTOMATIC EXPIRATION CHECK SYSTEM ---
    // Check for expired listings every minute (older than 24h)
    setInterval(() => {
        const checkExpired = `SELECT * FROM market_listings WHERE created_at < NOW() - INTERVAL 1 DAY`;
        
        db.query(checkExpired, (err, expiredListings) => {
            if (err) return console.error("Market Expiration Error:", err);
            
            if (expiredListings.length > 0) {
                console.log(`Found ${expiredListings.length} expired listings. Processing...`);
                
                expiredListings.forEach(listing => {
                    // 1. Return items to Inventory
                    // Using ON DUPLICATE KEY UPDATE to handle both cases (row exists or not) efficiently
                    const returnQuery = `INSERT INTO inventory (user_id, item_key, quantity) VALUES (?, ?, ?) 
                                         ON DUPLICATE KEY UPDATE quantity = quantity + ?`;
                    
                    db.query(returnQuery, [listing.seller_id, listing.item_key, listing.quantity, listing.quantity], (err) => {
                        if (err) return console.error(`Failed to return items for listing ${listing.id}:`, err);
                        
                        // 2. Delete the Listing
                        db.query('DELETE FROM market_listings WHERE id = ?', [listing.id], (err) => {
                            if (err) console.error(`Failed to delete expired listing ${listing.id}:`, err);
                            else console.log(`Listing ${listing.id} expired. Items returned to Seller ${listing.seller_id}.`);
                        });
                    });
                });
            }
        });
    }, 60000); // Check every 60 seconds

    return router;
};
