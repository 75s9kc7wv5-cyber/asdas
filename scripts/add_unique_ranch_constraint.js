const mysql = require('mysql2');
const dbConfig = {
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
};

const connection = mysql.createConnection(dbConfig);

const addConstraint = async () => {
    try {
        console.log('Adding unique constraint to player_ranches...');
        await connection.promise().query('ALTER TABLE player_ranches ADD UNIQUE KEY unique_user_ranch (user_id, ranch_type_id)');
        console.log('Constraint added successfully.');
    } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
            console.log('Constraint already exists.');
        } else if (error.code === 'ER_DUP_ENTRY') {
            console.error('Error: Duplicate entries found. Cannot add unique constraint. Please clean up data first.');
        } else {
            console.error('Error adding constraint:', error);
        }
    } finally {
        connection.end();
    }
};

addConstraint();
