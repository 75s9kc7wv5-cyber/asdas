const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',     
    password: 'password', 
    database: 'simworld'
});

async function run() {
    // 1. Create a dummy user
    const username = 'MineUser' + Math.floor(Math.random() * 1000);
    const userId = await new Promise((resolve) => {
        db.query('INSERT INTO users (username, password, email, money, gold, diamond, education_skill) VALUES (?, "pass", ?, 1000000, 1000, 1000, 100)', [username, username + '@test.com'], (err, res) => {
            if (err) throw err;
            resolve(res.insertId);
        });
    });
    console.log(`Created User: ${username} (ID: ${userId})`);

    // 2. Clear existing mines (just in case)
    await new Promise(r => db.query('DELETE FROM player_mines WHERE user_id = ?', [userId], r));
    await new Promise(r => db.query('DELETE FROM licenses WHERE user_id = ? AND mine_type = ?', [userId, 'wood'], r));
    
    // 3. Add license
    await new Promise(r => db.query('INSERT INTO licenses (user_id, mine_type, level) VALUES (?, ?, 1)', [userId, 'wood'], r));

    // 4. Make the API call to buy mine
    try {
        const response = await fetch('http://localhost:3000/api/mines/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                mineType: 'wood' 
            })
        });
        const data = await response.json();
        console.log('Buy Response:', data);
    } catch (e) {
        console.error('API Error:', e);
    }

    // 5. Check DB
    db.query('SELECT name FROM player_mines WHERE user_id = ?', [userId], (err, rows) => {
        if (err) console.error(err);
        else {
            console.log('Mine Names in DB:');
            console.log(rows);
        }
        db.end();
    });
}

run();
