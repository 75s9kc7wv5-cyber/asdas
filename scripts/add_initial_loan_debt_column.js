const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Read DB config from server.js or hardcoded
const dbConfig = {
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
};

const connection = mysql.createConnection(dbConfig);

const addColumn = () => {
    const query = "ALTER TABLE bank_accounts ADD COLUMN initial_loan_debt DECIMAL(15,2) DEFAULT 0 AFTER loan_debt";
    
    connection.query(query, (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('initial_loan_debt column already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('initial_loan_debt column added successfully.');
        }
        
        // Also update existing records where loan_debt > 0 and initial_loan_debt is 0
        // We can't know the true initial, so setting it to current is the best fallback
        const updateQuery = "UPDATE bank_accounts SET initial_loan_debt = loan_debt WHERE loan_debt > 0 AND (initial_loan_debt IS NULL OR initial_loan_debt = 0)";
        connection.query(updateQuery, (err, res) => {
            if(err) console.error('Update error:', err);
            else console.log('Updated existing records:', res.affectedRows);
            connection.end();
        });
    });
};

addColumn();