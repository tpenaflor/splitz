const clark = require('./clark.json');
const ty = require('./ty.json');

function findGaps(activity) {
  let maxGap = 0;
  let gapStart = 0;
  for (let i = 0; i < activity.positions.length - 1; i++) {
    const gap = activity.positions[i+1].time - activity.positions[i].time;
    if (gap > maxGap) {
      maxGap = gap;
      gapStart = activity.positions[i].time;
    }
  }
  return { maxGap, gapStart };
}

console.log("Clark gaps:", findGaps(clark));
console.log("Ty gaps:", findGaps(ty));

