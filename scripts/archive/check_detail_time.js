const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/mines/detail/1?userId=1&t=' + Date.now(),
    method: 'GET'
};

const req = http.request(options, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        const data = JSON.parse(body);
        console.log('Production Time:', data.mine.production_time);
    });
});

req.on('error', error => {
    console.error(error);
});

req.end();
