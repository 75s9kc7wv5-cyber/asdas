const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password'
});

connection.query('SHOW DATABASES', function (err, results) {
  if (err) {
      console.log('Error with password "password":', err.message);
      tryEmptyPassword();
  } else {
      console.log('Databases (password="password"):', results);
      connection.end();
  }
});

function tryEmptyPassword() {
    const connection2 = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: ''
    });

    connection2.query('SHOW DATABASES', function (err, results) {
        if (err) {
            console.log('Error with empty password:', err.message);
        } else {
            console.log('Databases (empty password):', results);
        }
        connection2.end();
    });
}
