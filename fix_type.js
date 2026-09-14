const fs = require('fs');
let content = fs.readFileSync('src/lib/segmentDetection.ts', 'utf-8');

content = content.replace(
  'lengthMeters: number;\n};',
  'lengthMeters: number;\n  name?: string;\n  isCustom?: boolean;\n};'
);

fs.writeFileSync('src/lib/segmentDetection.ts', content);
