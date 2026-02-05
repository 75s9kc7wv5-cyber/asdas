
// ==========================================
// CRYPTO EXCHANGE SYSTEM (APPENDED)
// ==========================================

// Get Market Data
app.get('/api/crypto/market', (req, res) => {
    const priceQuery = 'SELECT price, volume, created_at FROM market_history ORDER BY id DESC LIMIT 24'; 
    const bookQuery = `
        (SELECT 'bid' as type, price, SUM(remaining_amount) as total_amount FROM market_orders WHERE type='buy' AND status IN ('open','partial') GROUP BY price ORDER BY price DESC LIMIT 10)
        UNION ALL
        (SELECT 'ask' as type, price, SUM(remaining_amount) as total_amount FROM market_orders WHERE type='sell' AND status IN ('open','partial') GROUP BY price ORDER BY price ASC LIMIT 10)
    `;

    db.query(priceQuery, (err, history) => {
        if(err) { console.error(err); return res.status(500).json({error: 'Db error'}); }
        
        db.query(bookQuery, (err2, book) => {
             if(err2) { console.error(err2); return res.status(500).json({error: 'Db error'}); }
             
             const currentPrice = history.length > 0 ? history[0].price : 10000;
             const bids = book.filter(x => x.type === 'bid');
             const asks = book.filter(x => x.type === 'ask');
             
             res.json({
                 currentPrice: currentPrice,
                 history: history.reverse().map(h => ({ time: h.created_at, price: h.price })),
                 orderBook: { bids, asks }
             });
        });
    });
});

// Get User Orders
app.get('/api/crypto/orders/:userId', (req, res) => {
    const userId = req.params.userId;
    db.query('SELECT * FROM market_orders WHERE user_id = ? AND status IN ("open", "partial") ORDER BY created_at DESC', [userId], (err, results) => {
        if(err) return res.status(500).json({error: err});
        res.json(results);
    });
});

// Cancel Order
app.post('/api/crypto/cancel', (req, res) => {
    const { orderId } = req.body;
    db.beginTransaction(err => {
        if(err) return res.json({success: false, message: 'Tx Error'});
        
        db.query('SELECT * FROM market_orders WHERE id = ? FOR UPDATE', [orderId], (err, rows) => {
            if(rows.length === 0) {
                 db.rollback();
                 return res.json({success: false, message: 'Order not found'});
            }
            const order = rows[0];
            if(!['open', 'partial'].includes(order.status)) {
                db.rollback();
                return res.json({success: false, message: 'Cannot cancel closed order'});
            }

            let refundQuery = '';
            let params = [];
            if(order.type === 'buy') {
                const refund =  parseFloat(order.remaining_amount) * parseFloat(order.price);
                refundQuery = 'UPDATE users SET money = money + ? WHERE id = ?';
                params = [refund, order.user_id];
            } else {
                refundQuery = 'UPDATE users SET btc = btc + ? WHERE id = ?';
                params = [order.remaining_amount, order.user_id];
            }

            db.query(refundQuery, params, (err3) => {
                if(err3) { db.rollback(); return res.json({success:false}); }
                
                db.query('UPDATE market_orders SET status = "cancelled" WHERE id = ?', [orderId], (err4) => {
                    if(err4) { db.rollback(); return res.json({success:false}); }
                    
                    db.commit();
                    res.json({success: true, message: 'Emir İptal Edildi'});
                });
            });
        });
    });
});

// Place Order
app.post('/api/crypto/order', (req, res) => {
    const { userId, type, price, amount } = req.body;
    const numPrice = parseFloat(price);
    const numAmount = parseFloat(amount);
    
    if(numPrice <= 0 || numAmount <= 0) return res.json({success: false, message: 'Geçersiz değerler'});

    db.beginTransaction(err => {
        if(err) return res.json({success: false, message: 'Tx error'});

        const totalCost = numPrice * numAmount;
        
        db.query('SELECT money, btc FROM users WHERE id = ?', [userId], (err, users) => {
            if(users.length === 0) { db.rollback(); return res.json({success: false}); }
            const user = users[0];

            if(type === 'buy') {
                if(user.money < totalCost) {
                    db.rollback();
                    return res.json({success: false, message: 'Yetersiz Bakiye (USD)'});
                }
                db.query('UPDATE users SET money = money - ? WHERE id = ?', [totalCost, userId], (err2) => {
                    if(err2) { db.rollback(); return res.json({success:false, message: 'Db Error'}); }
                    createOrder();
                });
            } else {
                 if(user.btc < numAmount) {
                    db.rollback();
                    return res.json({success: false, message: 'Yetersiz BTC'});
                }
                db.query('UPDATE users SET btc = btc - ? WHERE id = ?', [numAmount, userId], (err2) => {
                    if(err2) { db.rollback(); return res.json({success:false, message: 'Db Error'}); }
                    createOrder();
                });
            }

            function createOrder() {
                db.query('INSERT INTO market_orders (user_id, type, price, initial_amount, remaining_amount, status) VALUES (?, ?, ?, ?, ?, "open")', 
                [userId, type, numPrice, numAmount, numAmount], (err3, result) => {
                    if(err3) { db.rollback(); return res.json({success:false, message: 'Insert Error'}); }
                    
                    const orderId = result.insertId;
                    db.commit((err4) => {
                        if(err4) return res.json({success:false});
                        matchOrders(orderId);
                        res.json({success: true, message: 'Emir Oluşturuldu'});
                    });
                });
            }
        });
    });
});

function matchOrders(newOrderId) {
    db.query('SELECT * FROM market_orders WHERE id = ?', [newOrderId], (err, rows) => {
        if(!rows || rows.length === 0) return;
        let order = rows[0];
        if(order.status !== 'open' && order.status !== 'partial') return;

        let matchQuery = '';
        if(order.type === 'buy') {
            matchQuery = 'SELECT * FROM market_orders WHERE type = "sell" AND status IN ("open","partial") AND price <= ? ORDER BY price ASC, created_at ASC';
        } else {
            matchQuery = 'SELECT * FROM market_orders WHERE type = "buy" AND status IN ("open","partial") AND price >= ? ORDER BY price DESC, created_at ASC';
        }

        db.query(matchQuery, [order.price], (err2, matches) => {
            if(!matches || matches.length === 0) return;
            processMatches(order, matches);
        });
    });
}

function processMatches(takerOrder, makerOrders) {
    if(makerOrders.length === 0 || parseFloat(takerOrder.remaining_amount) <= 0.00000001) return;

    const maker = makerOrders[0];
    const tradePrice = parseFloat(maker.price);
    const tradeAmount = Math.min(parseFloat(takerOrder.remaining_amount), parseFloat(maker.remaining_amount));
    const moneyFlow = tradeAmount * tradePrice;
    const commissionRate = 0.03; 

    db.beginTransaction(err => {
        if(err) return;

        let makerCreditSql = maker.type === 'buy' 
            ? 'UPDATE users SET btc = btc + ? WHERE id = ?'
            : 'UPDATE users SET money = money + ? WHERE id = ?';
        let makerCreditVal = maker.type === 'buy' ? tradeAmount * (1 - commissionRate) : moneyFlow * (1 - commissionRate);
        
        db.query(makerCreditSql, [makerCreditVal, maker.user_id], (errM) => {
            if(errM) { db.rollback(); return; }
            
            let takerCreditSql = '';
            let takerParams = [];
            if(takerOrder.type === 'buy') {
                const creditBtc = tradeAmount * (1 - commissionRate);
                const priceDiffRefund = (parseFloat(takerOrder.price) - tradePrice) * tradeAmount;
                takerCreditSql = 'UPDATE users SET btc = btc + ?, money = money + ? WHERE id = ?';
                takerParams = [creditBtc, priceDiffRefund, takerOrder.user_id];
            } else {
                const creditMoney = moneyFlow * (1 - commissionRate);
                takerCreditSql = 'UPDATE users SET money = money + ? WHERE id = ?';
                takerParams = [creditMoney, takerOrder.user_id];
            }
            
            db.query(takerCreditSql, takerParams, (errT) => {
                if(errT) { db.rollback(); return; }
                
                const updateOrder = (id, amountTaken) => {
                    return new Promise((resolve, reject) => {
                        db.query('UPDATE market_orders SET remaining_amount = remaining_amount - ?, status = CASE WHEN remaining_amount <= 0.00000001 THEN "filled" ELSE "partial" END WHERE id = ?', 
                        [amountTaken, id], (e) => e ? reject(e) : resolve());
                    });
                };
                
                Promise.all([
                    updateOrder(maker.id, tradeAmount),
                    updateOrder(takerOrder.id, tradeAmount)
                ]).then(() => {
                     db.query('INSERT INTO market_trades (buyer_order_id, seller_order_id, price, amount) VALUES (?, ?, ?, ?)', 
                     [maker.type==='buy'?maker.id:takerOrder.id, maker.type==='sell'?maker.id:takerOrder.id, tradePrice, tradeAmount], (errTr) => {
                         db.query('INSERT INTO market_history (price, volume) VALUES (?, ?)', [tradePrice, tradeAmount], () => {
                             db.commit((errC) => {
                                 if(!errC) matchOrders(takerOrder.id);
                             });
                         });
                     });
                }).catch((e) => { console.error(e); db.rollback(); });
            });
        });
    });
}
