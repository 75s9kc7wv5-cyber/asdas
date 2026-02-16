const mysql = require('mysql2');
const axios = require('axios'); // I need axios or http to call API
// Or I can just simulate the logic if I want to check DB only.
// But I want to test the `src/server.js` endpoint.

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',     
    password: 'password', 
    database: 'simworld'
});

async function run() {
    // 1. Create a dummy user
    const username = 'TestUser' + Math.floor(Math.random() * 1000);
    const userId = await new Promise((resolve) => {
        db.query('INSERT INTO users (username, password, email, money, gold, diamond) VALUES (?, "pass", ?, 1000000, 1000, 1000)', [username, username + '@test.com'], (err, res) => {
            if (err) throw err;
            resolve(res.insertId);
        });
    });
    console.log(`Created User: ${username} (ID: ${userId})`);

    // 2. Clear existing ranches for this user (just in case)
    await new Promise(r => db.query('DELETE FROM player_ranches WHERE user_id = ?', [userId], r));

    // 2.5 Add license
    await new Promise(r => db.query('INSERT INTO licenses (user_id, mine_type, level) VALUES (?, "chicken", 1)', [userId], r));

    // 3. Make the API call to buy ranch
    try {
        const response = await fetch('http://localhost:3000/api/ranches/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                ranchType: 'chicken' // assuming 'chicken' slug exists
            })
        });
        const data = await response.json();
        console.log('Buy Response:', data);
    } catch (e) {
        console.error('API Error:', e);
    }

    // 4. Check DB
    db.query('SELECT name FROM player_ranches WHERE user_id = ?', [userId], (err, rows) => {
        if (err) console.error(err);
        else {
            console.log('Ranch Names in DB:');
            console.log(rows);
        }
        db.end();
    });
}

run();
