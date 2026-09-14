const fs = require('fs');
const FitParser = require('fit-file-parser').default;

function getDistance(p1, p2) {
  const R = 6371e3;
  const phi1 = p1.lat * Math.PI / 180;
  const phi2 = p2.lat * Math.PI / 180;
  const deltaPhi = (p2.lat - p1.lat) * Math.PI / 180;
  const deltaLambda = (p2.lon - p1.lon) * Math.PI / 180;

  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function parseFIT(filePath) {
  return new Promise((resolve) => {
    const buffer = fs.readFileSync(filePath);
    const fitParser = new FitParser({
      force: true, speedUnit: 'm/s', lengthUnit: 'm', temperatureUnit: 'celsius', elapsedRecordField: true, mode: 'both'
    });
    fitParser.parse(buffer, (err, data) => {
      if (err) return resolve(null);
      const positions = [];
      for (const record of data.records) {
        if (record.position_lat !== undefined && record.position_long !== undefined) {
          positions.push({
            time: new Date(record.timestamp).getTime() / 1000,
            lat: record.position_lat,
            lon: record.position_long,
          });
        }
      }
      resolve(positions);
    });
  });
}

async function run() {
  const posA = await parseFIT('test_files/SFU A.fit');
  const posB = await parseFIT('test_files/SFU B.fit');
  
  const ref = { id: 'A', positions: posA };
  const other = { id: 'B', positions: posB };
  const activities = [ref, other];

  const PROXIMITY = 50;
  const MIN_LEN = 500;
  const isCommon = new Array(ref.positions.length).fill(false);

  for (let i = 0; i < ref.positions.length; i++) {
    const p1 = ref.positions[i];
    let found = false;
    for (let j = 0; j < other.positions.length; j += 3) {
      if (getDistance(p1, other.positions[j]) < PROXIMITY) {
        found = true; break;
      }
    }
    isCommon[i] = found;
  }

  const segments = [];
  let inSegment = false, startIdx = 0, currentLength = 0;
  for (let i = 0; i < isCommon.length; i++) {
    if (isCommon[i]) {
      if (!inSegment) { inSegment = true; startIdx = i; currentLength = 0; }
      else if (i > 0) currentLength += getDistance(ref.positions[i-1], ref.positions[i]);
    } else {
      if (inSegment) {
        if (currentLength >= MIN_LEN) segments.push({ startIdx, endIndex: i - 1, len: currentLength });
        inSegment = false;
      }
    }
  }

  console.log('Detected Segments:', segments.length);
  
  segments.forEach((seg, idx) => {
    console.log(`\nSegment ${idx + 1}: length ${seg.len.toFixed(0)}m, refs: ${seg.startIdx} to ${seg.endIndex}`);
    const refStart = ref.positions[seg.startIdx];
    const refEnd = ref.positions[seg.endIndex];
    
    for (const act of activities) {
      const startCands = [];
      for (let i=0; i<act.positions.length; i++) {
        if (getDistance(act.positions[i], refStart) < 150) startCands.push(i);
      }
      if (startCands.length === 0) {
        let md = Infinity, si=0;
        for (let i=0; i<act.positions.length; i++) {
          const d = getDistance(act.positions[i], refStart);
          if (d < md) { md = d; si = i; }
        }
        startCands.push(si);
      }

      let bestMatch = { s: 0, e: 0, score: Infinity };
      for (const s of startCands) {
        let md = Infinity, e = s, found = false;
        for (let i=s; i<act.positions.length; i++) {
          const d = getDistance(act.positions[i], refEnd);
          if (d < md) { md = d; e = i; }
          if (d < 150) found = true;
          if (found && d > md + 150) break;
        }
        const dur = act.positions[e].time - act.positions[s].time;
        let score = getDistance(act.positions[s], refStart) + md;
        if (dur < 10) score += 100000;
        if (score < bestMatch.score) bestMatch = { s, e, score, dur };
      }
      console.log(`  Act ${act.id}: s=${bestMatch.s} e=${bestMatch.e} dur=${bestMatch.dur} score=${bestMatch.score.toFixed(1)}`);
    }
  });
}
run();
