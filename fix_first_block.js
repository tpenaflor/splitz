const fs = require('fs');
let content = fs.readFileSync('src/components/TelemetryChart.tsx', 'utf-8');

const oldBlock = `
          if (idx >= 0 && idx < act.positions.length) {
            let val = act.positions[idx][activeMetric];
            if (activeMetric === 'speed' && val) val = val * 3.6;
            point[act.id] = val || null;
            if (act.id === activities[0].id) {
`;

const newBlock = `
          if (idx >= 0 && idx < act.positions.length) {
            let val = act.positions[idx][activeMetric];
            if (activeMetric === 'power' && useNP && act.positions[idx].normalizedPower !== undefined) {
              val = act.positions[idx].normalizedPower;
            }
            if (activeMetric === 'speed' && val) val = val * 3.6;
            point[act.id] = val || null;
            if (act.id === activities[0].id) {
`;

content = content.replace(oldBlock.trim(), newBlock.trim());
fs.writeFileSync('src/components/TelemetryChart.tsx', content);
