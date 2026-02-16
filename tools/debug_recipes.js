const fs = require('fs');
const content = fs.readFileSync('src/server.js', 'utf8');

// Simple regex to extract FACTORY_RECIPES object content
// This is rough but should work if the indentation matches what I saw earlier
const match = content.match(/const FACTORY_RECIPES = \{([\s\S]*?)\};/);

if (match) {
    console.log("FACTORY_RECIPES extraction:");
    console.log("{" + match[1] + "}");
} else {
    console.log("Could not exact FACTORY_RECIPES");
}
