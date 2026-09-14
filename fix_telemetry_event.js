const fs = require('fs');
let content = fs.readFileSync('src/components/TelemetryChart.tsx', 'utf-8');

const oldEventBlock = `
        if (appMode === 'event') {
          const minTime = Math.min(...activities.map(a => a.startTime));
          const absoluteTime = minTime + t;
          const idx = Math.floor(absoluteTime - act.startTime);
          if (idx >= 0 && idx < act.positions.length) {
            let val = act.positions[idx][activeMetric];
            if (smoothing > 0 && typeof val === 'number') {
              let sum = 0;
              let count = 0;
              for (let j = idx; j >= Math.max(0, idx - smoothing); j--) {
                const v = act.positions[j][activeMetric];
                if (typeof v === 'number') {
                  sum += v;
                  count++;
                }
              }
              val = count > 0 ? sum / count : val;
            }
            if (activeMetric === 'speed' && val) val = val * 3.6;
            point[act.id] = val || null;
            if (act.id === activities[0].id) {
              point['elevation'] = act.positions[idx].elevation || null;
            }
          }
        }
`;

const newEventBlock = `
        if (appMode === 'event') {
          const minTime = Math.min(...activities.map(a => a.startTime));
          const absoluteTime = minTime + t;
          // Use binary search (or approx findIndex) to handle GPS pauses/gaps correctly!
          // Since it's sorted by time, we can find the closest point.
          let idx = -1;
          // Optimize finding the index since we are iterating t linearly
          // Actually, we can just use binary search, but for a 200-bucket chart findIndex is fine.
          // To make it fast, we can use binary search manually or just find the first point >= absoluteTime
          let low = 0, high = act.positions.length - 1;
          while (low <= high) {
            const mid = (low + high) >> 1;
            if (act.positions[mid].time < absoluteTime) {
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }
          idx = low < act.positions.length ? low : -1;

          if (idx !== -1 && Math.abs(act.positions[idx].time - absoluteTime) < 60) {
            let val = act.positions[idx][activeMetric];
            if (smoothing > 0 && typeof val === 'number') {
              let sum = 0;
              let count = 0;
              for (let j = idx; j >= Math.max(0, idx - smoothing); j--) {
                const v = act.positions[j][activeMetric];
                if (typeof v === 'number') {
                  sum += v;
                  count++;
                }
              }
              val = count > 0 ? sum / count : val;
            }
            if (activeMetric === 'speed' && val) val = val * 3.6;
            point[act.id] = val || null;
            if (act.id === activities[0].id) {
              point['elevation'] = act.positions[idx].elevation || null;
            }
          }
        }
`;

content = content.replace(oldEventBlock.trim(), newEventBlock.trim());
fs.writeFileSync('src/components/TelemetryChart.tsx', content);
