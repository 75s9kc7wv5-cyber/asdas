// ~/proje/deploy.js
const express = require('express');
const { exec } = require('child_process');
const app = express();

app.post('/deploy', (req, res) => {
    exec('cd ~/proje && git pull origin main', (err, stdout, stderr) => {
        if (err) console.error(err);
        console.log(stdout);
        console.error(stderr);
    });
    res.send('Deploy triggered');
});

app.listen(9000, '0.0.0.0', () => {
    console.log('Deploy server running on port 9000');
});
