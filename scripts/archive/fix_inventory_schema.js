const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(async (err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    try {
        // 1. Get consolidated inventory
        const [rows] = await db.promise().query(`
            SELECT user_id, item_key, SUM(quantity) as total_quantity 
            FROM inventory 
            GROUP BY user_id, item_key
        `);

        console.log(`Found ${rows.length} unique inventory items.`);

        // 2. Start Transaction
        await db.promise().beginTransaction();

        // 3. Delete all rows (We will re-insert consolidated)
        await db.promise().query('DELETE FROM inventory');

        // 4. Re-insert consolidated rows
        if (rows.length > 0) {
            const values = rows.map(row => [row.user_id, row.item_key, row.total_quantity]);
            await db.promise().query('INSERT INTO inventory (user_id, item_key, quantity) VALUES ?', [values]);
        }
        console.log('Consolidated inventory re-inserted.');

        // 5. Add Unique Index
        // Check if index exists first to avoid error? Or just try to add it.
        // We'll try to add it. If it exists, it might error, but that's fine.
        try {
            await db.promise().query('ALTER TABLE inventory ADD UNIQUE KEY unique_user_item (user_id, item_key)');
            console.log('Unique index added.');
        } catch (e) {
            if (e.code === 'ER_DUP_KEYNAME') {
                console.log('Unique index already exists.');
            } else {
                throw e;
            }
        }

        await db.promise().commit();
        console.log('Inventory schema fixed successfully.');

    } catch (error) {
        console.error('Error fixing inventory:', error);
        await db.promise().rollback();
    } finally {
        db.end();
    }
});
