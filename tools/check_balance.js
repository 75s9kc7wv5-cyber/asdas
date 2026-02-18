const fs = require('fs');
const content = fs.readFileSync('src/server.js', 'utf8');

let braces = 0;
let parens = 0;
let brackets = 0;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '{') braces++;
    else if (char === '}') braces--;
    else if (char === '(') parens++;
    else if (char === ')') parens--;
    else if (char === '[') brackets++;
    else if (char === ']') brackets--;
    
    if (braces < 0) console.log('Negative braces at ' + i);
    if (parens < 0) console.log('Negative parens at ' + i);
    if (brackets < 0) console.log('Negative brackets at ' + i);
}

console.log('Final counts:');
console.log('Braces: ' + braces);
console.log('Parens: ' + parens);
console.log('Brackets: ' + brackets);
