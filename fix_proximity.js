const fs = require('fs');

let content = fs.readFileSync('src/store/useAppStore.ts', 'utf-8');

// Add getDistance to imports
content = content.replace(
  "import { detectCommonSegments, DetectedSegment, ActivitySegmentResult, computeSegmentResults } from '../lib/segmentDetection';",
  "import { detectCommonSegments, DetectedSegment, ActivitySegmentResult, computeSegmentResults, getDistance } from '../lib/segmentDetection';"
);

const oldFuncRegex = /function computeEventBounds[\s\S]*?return \{\s*minTime: firstMeetup - PRIVACY_BUFFER_SECONDS,\s*maxTime: lastSeparation \+ PRIVACY_BUFFER_SECONDS\s*\};\s*\}/;

const newFunc = `
function computeEventBounds(activities: ActivityData[], segments: DetectedSegment[], privacyMode: boolean) {
  if (activities.length === 0) return { minTime: null, maxTime: null };
  const allStartTimes = activities.map(a => a.startTime);
  const allEndTimes = activities.map(a => a.endTime);
  
  if (!privacyMode || activities.length < 2) {
    return {
      minTime: Math.min(...allStartTimes),
      maxTime: Math.max(...allEndTimes)
    };
  }

  // Find overlapping time window where all activities are active
  const maxStart = Math.max(...allStartTimes);
  const minEnd = Math.min(...allEndTimes);

  if (maxStart > minEnd) {
    // They don't overlap in time at all! Privacy mode based on proximity is impossible.
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
`;

content = content.replace(oldFuncRegex, newFunc.trim());

fs.writeFileSync('src/store/useAppStore.ts', content);
