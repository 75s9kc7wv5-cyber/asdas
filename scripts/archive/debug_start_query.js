const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) throw err;
    
    const userId = 1;
    const mineId = 5; // Wood mine 2

    const query = `
        SELECT u.energy, u.health, u.education_skill, m.id as mine_id, m.max_workers, m.reserve, m.salary, m.vault, m.mine_type, m.stock, m.level, m.user_id as owner_id,
        (SELECT level FROM arge_levels WHERE user_id = m.user_id AND mine_type = m.mine_type) as arge_level,
        (SELECT production_time FROM mine_settings WHERE mine_type = m.mine_type) as production_time,
        (SELECT COUNT(*) FROM mine_active_workers WHERE mine_id = m.id AND end_time > NOW()) as current_workers,
        (SELECT COUNT(*) FROM mine_active_workers WHERE user_id = ? AND end_time > NOW()) as any_active_workers
        FROM users u, player_mines m
        WHERE u.id = ? AND m.id = ?
    `;

    db.query(query, [userId, userId, mineId], (err, results) => {
        if (err) console.error(err);
        else {
            console.log('Start Query Result:', results[0]);
        }
        db.end();
    });
});
