import { Position, ActivityData } from '../store/useAppStore';

const R = 6371e3; // Earth radius in meters

export function getDistance(p1: {lat: number, lon: number}, p2: {lat: number, lon: number}) {
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

export type DetectedSegment = {
  id: string;
  startIndex: number; // index on the reference activity
  endIndex: number;
  lengthMeters: number;
  name?: string;
  isCustom?: boolean;
};

const PROXIMITY_THRESHOLD = 50; // meters
const MIN_SEGMENT_LENGTH = 500; // meters

export function detectCommonSegments(activities: ActivityData[]): DetectedSegment[] {
  if (activities.length < 2) return [];

  const ref = activities[0];
  const others = activities.slice(1);

  const isCommon = new Array(ref.positions.length).fill(false);

  // For optimization, we don't need to check every single point against every single point.
  // But for typical activities (< 10k points), an O(N*M) check is okay if M is optimized.
  // To avoid full O(N*M), we could use spatial indexing, or just a simple sliding window search
  // since time/space are generally correlated. For now, a brute force with early exit per point is fine.

  for (let i = 0; i < ref.positions.length; i++) {
    const p1 = ref.positions[i];
    let allOthersHavePoint = true;

    for (const other of others) {
      let found = false;
      // We can just scan the other array. (In real production, use a quadtree or k-d tree).
      // But let's step by a stride of 5 to speed up the brute force check slightly
      for (let j = 0; j < other.positions.length; j += 3) {
        if (getDistance(p1, other.positions[j]) < PROXIMITY_THRESHOLD) {
          found = true;
          break;
        }
      }
      if (!found) {
        allOthersHavePoint = false;
        break;
      }
    }
    isCommon[i] = allOthersHavePoint;
  }

  // Group continuous trues
  const segments: DetectedSegment[] = [];
  let inSegment = false;
  let startIdx = 0;
  let currentLength = 0;

  for (let i = 0; i < isCommon.length; i++) {
    if (isCommon[i]) {
      if (!inSegment) {
        inSegment = true;
        startIdx = i;
        currentLength = 0;
      } else if (i > 0) {
        currentLength += getDistance(ref.positions[i-1], ref.positions[i]);
      }
    } else {
      if (inSegment) {
        if (currentLength >= MIN_SEGMENT_LENGTH) {
          segments.push({
            id: Math.random().toString(36).substr(2, 9),
            startIndex: startIdx,
            endIndex: i - 1,
            lengthMeters: currentLength
          });
        }
        inSegment = false;
      }
    }
  }

  // Close final segment if it reaches the end
  if (inSegment && currentLength >= MIN_SEGMENT_LENGTH) {
    segments.push({
      id: Math.random().toString(36).substr(2, 9),
      startIndex: startIdx,
      endIndex: isCommon.length - 1,
      lengthMeters: currentLength
    });
  }

  return segments;
}

export type ActivitySegmentResult = {
  activityId: string;
  startTime: number;
  endTime: number;
  duration: number;
};

export function computeSegmentResults(
  activities: ActivityData[], 
  refStartPos: Position, 
  refEndPos: Position,
  segmentLengthMeters: number,
  baseTimeConstraints?: Record<string, { minTime: number, maxTime: number }>
): ActivitySegmentResult[] {
  const results: ActivitySegmentResult[] = [];
  const minPossibleDuration = segmentLengthMeters / 40; // Assume max speed of 40m/s (144km/h). Anything faster is physically impossible for a bike.

  for (const activity of activities) {
    const startCandidates: number[] = [];
    const constraint = baseTimeConstraints ? baseTimeConstraints[activity.id] : null;
    for (let i = 0; i < activity.positions.length; i++) {
      const p = activity.positions[i];
      if (constraint && (p.time < constraint.minTime || p.time > constraint.maxTime)) {
        continue;
      }
      if (getDistance(p, refStartPos) < 150) {
         startCandidates.push(i);
      }
    }

    if (startCandidates.length === 0) {
      let minD = Infinity; let sI = 0;
      for (let i = 0; i < activity.positions.length; i++) {
        const d = getDistance(activity.positions[i], refStartPos);
        if (d < minD) { minD = d; sI = i; }
      }
      startCandidates.push(sI);
    }

    let bestMatch = { startIdx: 0, endIdx: 0, score: Infinity };

    for (const sIdx of startCandidates) {
      let minEndDist = Infinity;
      let eIdx = sIdx;
      let foundPass = false;
      
      for (let i = sIdx; i < activity.positions.length; i++) {
        const durationFromStart = activity.positions[i].time - activity.positions[sIdx].time;
        
        // Impossible to finish the segment this fast. 
        // This prevents matching the end line immediately if the segment is a loop.
        if (durationFromStart < minPossibleDuration) {
          continue;
        }

        const dist = getDistance(activity.positions[i], refEndPos);
        if (dist < minEndDist) {
          minEndDist = dist;
          eIdx = i;
        }
        
        if (dist < 150) {
          foundPass = true;
        }
        
        if (foundPass && dist > minEndDist + 150) {
          break;
        }
      }

      const duration = activity.positions[eIdx].time - activity.positions[sIdx].time;
      let score = getDistance(activity.positions[sIdx], refStartPos) + minEndDist;
      
      if (duration < minPossibleDuration) {
         score += 100000;
      }

      if (score < bestMatch.score) {
        bestMatch = { startIdx: sIdx, endIdx: eIdx, score };
      }
    }

    const startTime = activity.positions[bestMatch.startIdx].time;
    const endTime = activity.positions[bestMatch.endIdx].time;

    results.push({
      activityId: activity.id,
      startTime,
      endTime,
      duration: Math.max(0, endTime - startTime)
    });
  }

  return results;
}
const PRIVACY_BUFFER_SECONDS = 180;

export function computeEventBounds(activities: ActivityData[], segments: DetectedSegment[], privacyMode: boolean) {
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