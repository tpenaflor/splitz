const fs = require('fs');
let content = fs.readFileSync('src/components/MapComponent.tsx', 'utf-8');

const oldLoop = `
    for (let i = baseSeg.startIndex; i <= baseSeg.endIndex; i++) {
      const p = ref.positions[i];
      const dx = p.lon - lng;
      const dy = p.lat - lat;
      const dist = dx * dx + dy * dy;
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    if (type === 'start') {
      if (closestIndex >= segmentRange[1]) closestIndex = segmentRange[1] - 1;
      useAppStore.getState().setSegmentRange([closestIndex, segmentRange[1]]);
    } else {
      if (closestIndex <= segmentRange[0]) closestIndex = segmentRange[0] + 1;
      useAppStore.getState().setSegmentRange([segmentRange[0], closestIndex]);
    }
`;

const newLoop = `
    const searchStart = type === 'start' ? baseSeg.startIndex : segmentRange[0] + 1;
    const searchEnd = type === 'start' ? segmentRange[1] - 1 : baseSeg.endIndex;

    for (let i = searchStart; i <= searchEnd; i++) {
      const p = ref.positions[i];
      // Haversine approximation scaling for latitude distortion
      const latMid = (p.lat + lat) / 2 * Math.PI / 180;
      const dx = (p.lon - lng) * Math.cos(latMid);
      const dy = p.lat - lat;
      const dist = dx * dx + dy * dy;
      
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    if (type === 'start') {
      useAppStore.getState().setSegmentRange([closestIndex, segmentRange[1]]);
    } else {
      useAppStore.getState().setSegmentRange([segmentRange[0], closestIndex]);
    }
`;

content = content.replace(oldLoop.trim(), newLoop.trim());

fs.writeFileSync('src/components/MapComponent.tsx', content);
