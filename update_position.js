const fs = require('fs');
let content = fs.readFileSync('src/store/useAppStore.ts', 'utf-8');

content = content.replace(
  'power?: number;\n  cadence?: number;',
  'power?: number;\n  normalizedPower?: number;\n  cadence?: number;'
);

fs.writeFileSync('src/store/useAppStore.ts', content);
