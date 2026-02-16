// ==========================================
// CRYPTO EXCHANGE SYSTEM (APPENDED)
// ==========================================

// Get Simple Market Data & Logs
app.get('/api/crypto/market', (req, res) => {
    const historyQuery = 'SELECT price, created_at FROM market_history ORDER BY id DESC LIMIT 50'; 
    const logQuery = `
        SELECT mt.*, u.username, u.avatar 
        FROM market_trades mt 
        JOIN users u ON mt.user_id = u.id 
        ORDER BY mt.id DESC LIMIT 20
    `;
    const priceQuery = 'SELECT price FROM market_history ORDER BY id DESC LIMIT 1';

    db.query(historyQuery, (err, history) => {
        if(err) { console.error(err); return res.status(500).json({error: 'Db error'}); }
        
        db.query(logQuery, (err2, trades) => {
             if(err2) { console.error(err2); return res.status(500).json({error: 'Db error'}); }
             
             db.query(priceQuery, (err3, priceRows) => {
                 const currentPrice = (priceRows && priceRows.length > 0) ? priceRows[0].price : 10000;
                 
                 res.json({
                     price: parseFloat(currentPrice),
                     history: history.reverse().map(h => ({ time: h.created_at, price: h.price })),
                     trades: trades.map(t => ({
                         avatar: t.avatar,
                         username: t.username,
                         type: t.type,
                         amount: t.amount,
                         price: t.price,
                         time: t.created_at
                     }))
                 });
             });
        });
    });
});

// Instant Trade Logic
app.post('/api/crypto/trade', (req, res) => {
    const { userId, type, amount } = req.body;
    const numAmount = parseFloat(amount);
    
    if(numAmount <= 0) return res.json({success: false, message: 'Geçersiz miktar'});

    db.beginTransaction(err => {
        if(err) return res.json({success:false, message: 'Tx Error'});

        // Get Current Price
        db.query('SELECT price FROM market_history ORDER BY id DESC LIMIT 1', (err, rows) => {
            let currentPrice = (rows && rows.length > 0) ? parseFloat(rows[0].price) : 10000;
            
            // Calculate Total
            let totalValue = numAmount * currentPrice;

            db.query('SELECT money, btc FROM users WHERE id = ? FOR UPDATE', [userId], (err, users) => {
                if(users.length === 0) { db.rollback(); return res.json({success:false}); }
                const user = users[0];

                if(type === 'buy') {
                    if(user.money < totalValue) {
                        db.rollback();
                        return res.json({success: false, message: 'Yetersiz Bakiye ($)'});
                    }
                    db.query('UPDATE users SET money = money - ?, btc = btc + ? WHERE id = ?', 
                    [totalValue, numAmount, userId], (e) => processTrade(e));

                } else { // SELL
                    if(user.btc < numAmount) {
                         db.rollback();
                        return res.json({success: false, message: 'Yetersiz BTC'});
                    }
                    db.query('UPDATE users SET btc = btc - ?, money = money + ? WHERE id = ?', 
                    [numAmount, totalValue, userId], (e) => processTrade(e));
                }

                function processTrade(updateErr) {
                    if(updateErr) { db.rollback(); return res.json({success:false, message: 'Db Update Error'}); }
                    
                    // Log Trade
                    db.query('INSERT INTO market_trades (user_id, type, price, amount, total_price) VALUES (?, ?, ?, ?, ?)',
                    [userId, type, currentPrice, numAmount, totalValue], (e2) => {
                        if(e2) { db.rollback(); return res.json({success:false, message: 'Log Error'}); }

                        // Update Market Price (Flash Volatility)
                        // Buy -> Price Up, Sell -> Price Down
                        const impactFactor = 0.005; // 0.5% shift per 1 BTC traded (high volatility for game)
                        let change = (numAmount * impactFactor) * currentPrice;
                        // Add some randomness
                        const noise = (Math.random() - 0.5) * (currentPrice * 0.002); 
                        
                        let newPrice = type === 'buy' ? currentPrice + change + noise : currentPrice - change + noise;
                        if(newPrice < 0.01) newPrice = 0.01; // Floor

                        db.query('INSERT INTO market_history (price, volume) VALUES (?, ?)', [newPrice, numAmount], (e3) => {
                             if(e3) { db.rollback(); return res.json({success:false}); } // Should not fail usually
                             db.commit();
                             res.json({success: true, message: 'İşlem Başarılı', newPrice: newPrice});
                        });
                    });
                }
            });
        });
    });
});
