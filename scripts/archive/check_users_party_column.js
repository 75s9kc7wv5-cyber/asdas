const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    
    db.query('DESCRIBE users', (err, res) => {
        if(err) console.error('Describe users failed:', err);
        else {
            const hasPartyId = res.some(col => col.Field === 'party_id');
            console.log('Has party_id:', hasPartyId);
            console.log('Columns:', res.map(c => c.Field));
            db.end();
        }
    });
});
