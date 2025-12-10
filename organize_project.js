const fs = require('fs');
const path = require('path');

const dirs = [
    'public',
    'public/css',
    'public/js',
    'scripts',
    'src'
];

// Create Directories
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        console.log(`Created directory: ${dir}`);
    }
});

// File Categorization
const moves = [
    // CSS
    { pattern: /\.css$/, target: 'public/css' },
    // HTML
    { pattern: /\.html$/, target: 'public' },
    // Frontend JS (Explicit list to avoid moving server/scripts)
    { names: ['arge.js', 'game-engine.js', 'global-menu.js', 'header-manager.js', 'loader-manager.js', 'menu-manager.js'], target: 'public/js' },
    // Backend Scripts
    { pattern: /^(check_|create_|debug_|fix_|reset_|setup_|test_|update_).*\.js$/, target: 'scripts' },
    // Server
    { names: ['server.js'], target: 'src' }
];

// Move Files
fs.readdirSync('.').forEach(file => {
    const stats = fs.statSync(file);
    if (stats.isDirectory()) return;

    let targetDir = null;

    for (const move of moves) {
        if (move.names && move.names.includes(file)) {
            targetDir = move.target;
            break;
        }
        if (move.pattern && move.pattern.test(file)) {
            targetDir = move.target;
            break;
        }
    }

    if (targetDir) {
        const oldPath = path.join('.', file);
        const newPath = path.join(targetDir, file);
        fs.renameSync(oldPath, newPath);
        console.log(`Moved ${file} -> ${newPath}`);
    }
});

// Update HTML Imports
const publicDir = 'public';
if (fs.existsSync(publicDir)) {
    fs.readdirSync(publicDir).forEach(file => {
        if (file.endsWith('.html')) {
            const filePath = path.join(publicDir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Update CSS links (exclude http/https)
            content = content.replace(/href="(?!(http|https|\/|css\/))([^"]+\.css)"/g, 'href="css/$2"');
            
            // Update JS scripts (exclude http/https)
            content = content.replace(/src="(?!(http|https|\/|js\/))([^"]+\.js)"/g, 'src="js/$2"');

            fs.writeFileSync(filePath, content);
            console.log(`Updated imports in ${file}`);
        }
    });
}

// Update Server.js Paths
const serverPath = 'src/server.js';
if (fs.existsSync(serverPath)) {
    let content = fs.readFileSync(serverPath, 'utf8');
    
    // Update Static Path
    // Old: app.use(express.static(path.join(__dirname, '.')));
    // New: app.use(express.static(path.join(__dirname, '../public')));
    content = content.replace(
        /app\.use\(express\.static\(path\.join\(__dirname, ['"]\.['"]\)\)\);/g, 
        "app.use(express.static(path.join(__dirname, '../public')));"
    );

    // Update sendFile paths
    // Old: res.sendFile(path.join(__dirname, 'index.html'));
    // New: res.sendFile(path.join(__dirname, '../public/index.html'));
    content = content.replace(
        /res\.sendFile\(path\.join\(__dirname, ['"]([^'"]+\.html)['"]\)\);/g,
        "res.sendFile(path.join(__dirname, '../public/$1'));"
    );

    fs.writeFileSync(serverPath, content);
    console.log(`Updated paths in server.js`);
}

console.log('Organization complete!');
