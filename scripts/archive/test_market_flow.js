const mysql = require('mysql2');
const axios = require('axios');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

const API_URL = 'http://localhost:3000/api';

async function runTest() {
    // 1. Setup Data
    console.log('Setting up test data...');
    
    // Give User 1 (Seller) 100 iron
    await db.promise().query('INSERT INTO inventory (user_id, item_key, quantity) VALUES (1, "iron", 100) ON DUPLICATE KEY UPDATE quantity = 100');
    
    // Give User 2 (Buyer) 10000 money
    await db.promise().query('UPDATE users SET money = 10000 WHERE id = 2');
    
    // Ensure User 1 has 0 money for clarity
    await db.promise().query('UPDATE users SET money = 0 WHERE id = 1');

    // Clear market listings
    await db.promise().query('DELETE FROM market_listings');

    console.log('Data setup complete.');

    // 2. User 1 Sells 10 Iron for 50 each
    console.log('User 1 selling 10 iron for 50 each...');
    try {
        const sellRes = await axios.post(`${API_URL}/market/sell`, {
            userId: 1,
            itemId: 'iron',
            amount: 10,
            price: 50
        });
        console.log('Sell response:', sellRes.data);
    } catch (e) {
        console.error('Sell failed:', e.response ? e.response.data : e.message);
        return;
    }

    // Check Listing
    const [listings] = await db.promise().query('SELECT * FROM market_listings');
    console.log('Listings:', listings);
    const listingId = listings[0].id;

    // 3. User 2 Buys 5 Iron
    console.log('User 2 buying 5 iron...');
    try {
        const buyRes = await axios.post(`${API_URL}/market/buy`, {
            listingId: listingId,
            amount: 5,
            buyerId: 2
        });
        console.log('Buy response:', buyRes.data);
    } catch (e) {
        console.error('Buy failed:', e.response ? e.response.data : e.message);
        return;
    }

    // 4. Verify Results
    console.log('Verifying results...');
    
    // Check User 1 Money (Should be 5 * 50 = 250)
    const [user1] = await db.promise().query('SELECT money FROM users WHERE id = 1');
    console.log('User 1 Money (Expected 250):', user1[0].money);

    // Check User 2 Money (Should be 10000 - 250 = 9750)
    const [user2] = await db.promise().query('SELECT money FROM users WHERE id = 2');
    console.log('User 2 Money (Expected 9750):', user2[0].money);

    // Check User 2 Inventory (Should have 5 iron)
    const [inv2] = await db.promise().query('SELECT quantity FROM inventory WHERE user_id = 2 AND item_key = "iron"');
    console.log('User 2 Iron (Expected 5):', inv2[0] ? inv2[0].quantity : 0);

    // Check Listing Quantity (Should be 10 - 5 = 5)
    const [listingsAfter] = await db.promise().query('SELECT quantity FROM market_listings WHERE id = ?', [listingId]);
    console.log('Listing Quantity (Expected 5):', listingsAfter[0] ? listingsAfter[0].quantity : 'Deleted');

    // Check Notifications for User 1
    const [notifs] = await db.promise().query('SELECT * FROM notifications WHERE user_id = 1 ORDER BY id DESC LIMIT 1');
    console.log('User 1 Notification:', notifs[0]);

    db.end();
}

runTest();
