const http = require('http');

const data = JSON.stringify({
    userId: 1,
    name: 'Test Party 123',
    abbr: 'TST',
    ideology: 'Demokrat',
    color: '#e74c3c'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/parties/create',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
