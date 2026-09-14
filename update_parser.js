const fs = require('fs');
let content = fs.readFileSync('src/lib/parser.ts', 'utf-8');

const oldResolve = `
        if (positions.length === 0) {
          resolve(null);
          return;
        }

        resolve({
`;

const newResolve = `
        if (positions.length === 0) {
          resolve(null);
          return;
        }

        // Calculate Rolling Normalized Power
        let window = [];
        let sum4 = 0;
        let count4 = 0;
        for (let i = 0; i < positions.length; i++) {
          const p = positions[i].power || 0;
          window.push(p);
          if (window.length > 30) {
            window.shift();
          }
          if (window.length === 30) {
            let avg30 = window.reduce((a, b) => a + b, 0) / 30;
            sum4 += Math.pow(avg30, 4);
            count4++;
            positions[i].normalizedPower = Math.pow(sum4 / count4, 0.25);
          } else {
            positions[i].normalizedPower = p;
          }
        }

        resolve({
`;

content = content.replace(oldResolve.trim(), newResolve.trim());

fs.writeFileSync('src/lib/parser.ts', content);
