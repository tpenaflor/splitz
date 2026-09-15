const clark = require('./clark.json');
const target = 1783258260; // 6:31:00 AM PST

const idx = clark.positions.findIndex(p => p.time >= target);
console.log("Index:", idx);
console.log("Positions around it:");
console.log(clark.positions.slice(idx - 2, idx + 3));
