const clark = require('./clark.json');
const ty = require('./ty.json');

console.log("Clark endTime field:", clark.endTime);
console.log("Clark last pos time:", clark.positions[clark.positions.length - 1].time);
console.log("Ty endTime field:", ty.endTime);
console.log("Ty last pos time:", ty.positions[ty.positions.length - 1].time);
