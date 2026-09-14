const fs = require('fs');
let content = fs.readFileSync('src/components/MapComponent.tsx', 'utf-8');

const oldLines = `
    const searchRadius = 150; // limits jumps to ~150 points (seconds) to prevent teleporting across loops
    const searchStart = type === 'start' 
      ? Math.max(baseSeg.startIndex, segmentRange[0] - searchRadius)
      : segmentRange[0] + 1;
    const searchEnd = type === 'start' 
      ? segmentRange[1] - 1 
      : Math.min(baseSeg.endIndex, segmentRange[1] + searchRadius);
`;

const newLines = `
    const searchStart = type === 'start' ? baseSeg.startIndex : segmentRange[0] + 1;
    const searchEnd = type === 'start' ? segmentRange[1] - 1 : baseSeg.endIndex;
`;

content = content.replace(oldLines.trim(), newLines.trim());

fs.writeFileSync('src/components/MapComponent.tsx', content);
