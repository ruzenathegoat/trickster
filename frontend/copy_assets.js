const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\usER\\.gemini\\antigravity-ide\\brain\\04abecbb-21d5-42ae-bb33-07cc2a1affd2';
const destDir = path.join(__dirname, 'public', 'assets', 'images');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = {
  'deep_scouting_brutalist_1785456397444.png': 'feat1.png',
  'contextual_analytics_brutalist_1785456405476.png': 'feat2.png',
  'head_to_head_brutalist_1785456414358.png': 'feat3.png',
  'roster_architect_brutalist_1785456422700.png': 'feat4.png'
};

for (const [src, dest] of Object.entries(files)) {
  fs.copyFileSync(path.join(srcDir, src), path.join(destDir, dest));
}
console.log('Images copied successfully!');
