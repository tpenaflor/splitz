const fs = require('fs');
let content = fs.readFileSync('src/components/TelemetryChart.tsx', 'utf-8');

const oldElseBlock = `
            if (idx !== -1) {
              let val = act.positions[idx][activeMetric];
              if (activeMetric === 'speed' && val) val = val * 3.6;
              point[act.id] = val || null;
            if (act.id === activities[0].id) {
`;

const newElseBlock = `
            if (idx !== -1) {
              let val = act.positions[idx][activeMetric];
              if (activeMetric === 'power' && useNP && act.positions[idx].normalizedPower !== undefined) {
                val = act.positions[idx].normalizedPower;
              }
              if (activeMetric === 'speed' && val) val = val * 3.6;
              point[act.id] = val || null;
            if (act.id === activities[0].id) {
`;

content = content.replace(oldElseBlock.trim(), newElseBlock.trim());

// Also fix the first block so it handles `undefined` properly instead of `|| val` which fails on 0.
const oldFirstBlock = `let val = act.positions[idx][activeMetric];
            if (activeMetric === 'power' && useNP) val = act.positions[idx].normalizedPower || val;
            if (activeMetric === 'speed' && val) val = val * 3.6;
            point[act.id] = val || null;`;

const newFirstBlock = `let val = act.positions[idx][activeMetric];
            if (activeMetric === 'power' && useNP && act.positions[idx].normalizedPower !== undefined) {
              val = act.positions[idx].normalizedPower;
            }
            if (activeMetric === 'speed' && val) val = val * 3.6;
            point[act.id] = val || null;`;

content = content.replace(oldFirstBlock.trim(), newFirstBlock.trim());

fs.writeFileSync('src/components/TelemetryChart.tsx', content);
