const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testSharp() {
    try {
        const image = sharp({
            create: {
                width: 200,
                height: 200,
                channels: 4,
                background: { r: 255, g: 0, b: 0, alpha: 0.5 }
            }
        });

        const outputPath = path.join(__dirname, 'test-image.png');
        await image.png().toFile(outputPath);
        console.log('Sharp test successful, image created at:', outputPath);
        fs.unlinkSync(outputPath); // Clean up
    } catch (error) {
        console.error('Sharp test failed:', error);
    }
}

testSharp();
