const mysql = require('mysql2');

function tryCreds(user, password) {
    const connection = mysql.createConnection({
        host: 'localhost',
        user: user,
        password: password
    });

    connection.query('SHOW DATABASES', function (err, results) {
        if (err) {
            console.log(`Failed: ${user}:${password} -> ${err.message}`);
        } else {
            console.log(`SUCCESS: ${user}:${password}`);
            console.log(results);
        }
        connection.end();
    });
}

tryCreds('root', 'root');
tryCreds('vscode', '');
tryCreds('admin', 'admin');
