
const mysql = require('mysql2');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('DB Connection err:', err);
        process.exit(1);
    }
    console.log('Connected to DB');
    
    db.query('SELECT name, COUNT(*) as count FROM daily_jobs GROUP BY name HAVING count > 1', (err, results) => {
        if(err) {
            console.error(err);
            process.exit(1);
        }
        
        if(results.length === 0) {
            console.log('No duplicates found.');
            process.exit(0);
        }
        
        console.log('Duplicates found:', results);
        
        // Remove duplicates, keep lowest ID
        const names = results.map(r => r.name);
        
        // This query keeps the row with MIN(id) and deletes others
        const query = `
            DELETE t1 FROM daily_jobs t1
            INNER JOIN daily_jobs t2 
            WHERE t1.id > t2.id AND t1.name = t2.name
        `;
        
        db.query(query, (err, resDel) => {
            if(err) console.error(err);
            else console.log('Deleted duplicates:', resDel.affectedRows);
            process.exit(0);
        });
    });
});
