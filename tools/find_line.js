const fs = require('fs');
const content = fs.readFileSync('src/server.js', 'utf8');
const lines = content.slice(0, 75221).split('\n');
console.log('Line number: ' + lines.length);
console.log('Line content: ' + lines[lines.length - 1]);
