const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');

    const addColumn = (table, column, definition) => {
        return new Promise((resolve) => {
            const query = `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`;
            db.query(query, (err) => {
                if (err && err.code !== 'ER_DUP_FIELDNAME') {
                    console.error(`Error adding ${column}:`, err.message);
                } else {
                    console.log(`Column ${column} checked/added.`);
                }
                resolve();
            });
        });
    };

    Promise.all([
        addColumn('users', 'education_skill', 'INT DEFAULT 1'),
        addColumn('users', 'diamond', 'INT DEFAULT 0')
    ]).then(() => {
        console.log('Users table updated');
        db.end();
    });
});
