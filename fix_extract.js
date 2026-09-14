const fs = require('fs');

let store = fs.readFileSync('src/store/useAppStore.ts', 'utf-8');

const regex = /const PRIVACY_BUFFER_SECONDS = 180;[\s\S]*?lastSeparation \+ PRIVACY_BUFFER_SECONDS\s*};\s*\}/;
const match = store.match(regex);
const functionBody = match[0];

store = store.replace(functionBody, "");
store = store.replace(
  "import { detectCommonSegments, DetectedSegment, ActivitySegmentResult, computeSegmentResults, getDistance } from '../lib/segmentDetection';",
  "import { detectCommonSegments, DetectedSegment, ActivitySegmentResult, computeSegmentResults, getDistance, computeEventBounds } from '../lib/segmentDetection';"
);

fs.writeFileSync('src/store/useAppStore.ts', store);

let seg = fs.readFileSync('src/lib/segmentDetection.ts', 'utf-8');
const exportFunc = functionBody.replace('function computeEventBounds', 'export function computeEventBounds');
seg = seg + '\\n' + exportFunc;

fs.writeFileSync('src/lib/segmentDetection.ts', seg);
