const sharp = require('sharp');
const fs = require('fs');

console.log('Sharp version:', require('sharp/package.json').version);

try {
  sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 0.5 }
    }
  })
  .png()
  .toBuffer()
  .then(data => {
      console.log('Sharp works, buffer length:', data.length);
  })
  .catch(err => {
      console.error('Sharp failed:', err);
  });
} catch (e) {
  console.error('Sharp crashed:', e);
}
