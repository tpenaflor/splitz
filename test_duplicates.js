const clark = require('./clark.json');
const ty = require('./ty.json');

function checkDups(name, act) {
  for (let i = 0; i < act.positions.length - 1; i++) {
    if (act.positions[i].time === act.positions[i+1].time) {
      console.log(`${name} duplicate at time ${act.positions[i].time}, index ${i}`);
    }
  }
}
checkDups("Clark", clark);
checkDups("Ty", ty);
