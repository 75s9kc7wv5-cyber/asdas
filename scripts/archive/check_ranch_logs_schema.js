
const mysql = require('mysql2');
// require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) {
        console.error('DB Connection Failed:', err);
        process.exit(1);
    }
    console.log('Connected to DB');

    const tableName = 'ranch_logs';
    const columnName = 'earnings';

    db.query(`DESCRIBE ${tableName}`, (err, results) => {
        if (err) {
            console.error('Error describing table:', err);
            process.exit(1);
        }

        const hasColumn = results.some(row => row.Field === columnName);

        if (hasColumn) {
            console.log(`Column '${columnName}' already exists in '${tableName}'.`);
            process.exit(0);
        } else {
            console.log(`Adding column '${columnName}' to '${tableName}'...`);
            const alterQuery = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} DECIMAL(15,2) DEFAULT 0`;
            db.query(alterQuery, (err) => {
                if (err) {
                    console.error('Error adding column:', err);
                    process.exit(1);
                }
                console.log('Column added successfully.');
                process.exit(0);
            });
        }
    });
});
