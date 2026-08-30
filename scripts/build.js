const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'frontend');
const destDir = path.join(__dirname, '..', 'public');

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log('[BUILD SUCCESS] Successfully copied frontend files to public output directory');
} catch (err) {
  console.error('[BUILD WARNING]', err.message);
}
