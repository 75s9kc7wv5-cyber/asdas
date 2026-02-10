
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'simuser',
    password: 'password',
    database: 'simworld'
});

db.connect(err => {
    if (err) { console.error(err); process.exit(1); }
    console.log('Connected.');

    // Check user_properties
    db.query('SELECT * FROM user_properties LIMIT 5', (err, props) => {
        if(err) console.log(err);
        else {
            console.log('User Properties Sample:', props);
        }

        // Check property_types
        db.query('SELECT * FROM property_types LIMIT 5', (err, types) => {
            if(err) console.log(err);
            else {
                console.log('Property Types Sample:', types);
            }
            process.exit();
        });
    });
});
