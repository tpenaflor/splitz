const fs = require('fs');
let content = fs.readFileSync('src/lib/segmentDetection.ts', 'utf-8');

const oldFunc = `export function computeSegmentResults(
  activities: ActivityData[], 
  refStartPos: Position, 
  refEndPos: Position,
  segmentLengthMeters: number
): ActivitySegmentResult[] {`;

const newFunc = `export function computeSegmentResults(
  activities: ActivityData[], 
  refStartPos: Position, 
  refEndPos: Position,
  segmentLengthMeters: number,
  baseTimeConstraints?: Record<string, { minTime: number, maxTime: number }>
): ActivitySegmentResult[] {`;

content = content.replace(oldFunc, newFunc);

const oldCandidateLoop = `
    for (let i = 0; i < activity.positions.length; i++) {
      if (getDistance(activity.positions[i], refStartPos) < 150) {
         startCandidates.push(i);
      }
    }
`;

const newCandidateLoop = `
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
`;

content = content.replace(oldCandidateLoop, newCandidateLoop);

fs.writeFileSync('src/lib/segmentDetection.ts', content);
