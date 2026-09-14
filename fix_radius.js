const fs = require('fs');
let content = fs.readFileSync('src/components/MapComponent.tsx', 'utf-8');

// The issue is probably the index distance. Let's make the searchRadius 150 points (about 150 seconds).
content = content.replace('const searchRadius = 300;', 'const searchRadius = 150;');

fs.writeFileSync('src/components/MapComponent.tsx', content);
