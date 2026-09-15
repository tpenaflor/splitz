const clark = require('./clark.json');
const ty = require('./ty.json');

const R = 6371e3;
function getDistance(p1, p2) {
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

function computePrivacyBounds(activities, privacyMode) {
  const PRIVACY_BUFFER_SECONDS = 180;
  if (activities.length === 0) return { minTime: null, maxTime: null };
  const allStartTimes = activities.map(a => a.startTime);
  const allEndTimes = activities.map(a => a.endTime);
  
  if (!privacyMode || activities.length < 2) {
    return {
      minTime: Math.min(...allStartTimes),
      maxTime: Math.max(...allEndTimes)
    };
  }

  const maxStart = Math.max(...allStartTimes);
  const minEnd = Math.min(...allEndTimes);

  if (maxStart > minEnd) {
    return {
      minTime: Math.min(...allStartTimes),
      maxTime: Math.max(...allEndTimes)
    };
  }

  let firstMeetup = Infinity;
  let lastSeparation = -Infinity;
  const pointers = activities.map(() => 0);
  
  for (let i = 0; i < activities.length; i++) {
    while (pointers[i] < activities[i].positions.length && activities[i].positions[pointers[i]].time < maxStart) {
      pointers[i]++;
    }
  }

  let currentTime = maxStart;
  while (currentTime <= minEnd) {
    let maxDist = 0;
    for (let i = 0; i < activities.length; i++) {
      for (let j = i + 1; j < activities.length; j++) {
        const p1 = activities[i].positions[pointers[i]];
        const p2 = activities[j].positions[pointers[j]];
        if (p1 && p2) {
          const d = getDistance(p1, p2);
          if (d > maxDist) maxDist = d;
        }
      }
    }

    if (maxDist <= 150) {
      if (firstMeetup === Infinity) firstMeetup = currentTime;
      lastSeparation = currentTime;
    }

    currentTime++;
    for (let i = 0; i < activities.length; i++) {
      while (pointers[i] + 1 < activities[i].positions.length && activities[i].positions[pointers[i] + 1].time <= currentTime) {
        pointers[i]++;
      }
    }
  }

  if (firstMeetup === Infinity) {
    return {
      minTime: Math.min(...allStartTimes),
      maxTime: Math.max(...allEndTimes)
    };
  }

  return {
    minTime: firstMeetup - PRIVACY_BUFFER_SECONDS,
    maxTime: lastSeparation + PRIVACY_BUFFER_SECONDS
  };
}

const acts = [
  { id: 'clark', startTime: clark.startTime, endTime: clark.endTime, positions: clark.positions },
  { id: 'ty', startTime: ty.startTime, endTime: ty.endTime, positions: ty.positions }
];

const res = computePrivacyBounds(acts, true);
console.log("firstMeetup - 180:", res.minTime);
console.log("lastSeparation + 180:", res.maxTime);
console.log("lastSeparation time PST:", new Date((res.maxTime - 180) * 1000).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles" }));
console.log("maxTime time PST:", new Date(res.maxTime * 1000).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles" }));

