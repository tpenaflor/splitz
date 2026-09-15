const clark = require('./clark.json');
const ty = require('./ty.json');
const target = 1783269060; // 9:31:00 AM PST (6:31 AM HST)

const idx = clark.positions.findIndex(p => p.time >= target);
console.log("Clark Index:", idx);
console.log(clark.positions.slice(idx - 1, idx + 2));

const idxTy = ty.positions.findIndex(p => p.time >= target);
console.log("Ty Index:", idxTy);
console.log(ty.positions.slice(idxTy - 1, idxTy + 2));
