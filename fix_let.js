const fs = require('fs');
let content = fs.readFileSync('src/store/useAppStore.ts', 'utf-8');

// fix addActivity
content = content.replace(
  "const { minTime, maxTime } = computeEventBounds(newActivities, detectedSegments, state.privacyMode);\n    \n    const detectedSegments = detectCommonSegments(newActivities);",
  "const newDetectedSegments = detectCommonSegments(newActivities);\n    const { minTime, maxTime } = computeEventBounds(newActivities, newDetectedSegments, state.privacyMode);"
);
content = content.replace("detectedSegments\n    };\n  }),", "detectedSegments: newDetectedSegments\n    };\n  }),");


// fix removeActivity
content = content.replace(
  "const { minTime, maxTime } = computeEventBounds(newActivities, detectedSegments, state.privacyMode);\n    \n    const detectedSegments = detectCommonSegments(newActivities);",
  "const newDetectedSegments = detectCommonSegments(newActivities);\n    const { minTime, maxTime } = computeEventBounds(newActivities, newDetectedSegments, state.privacyMode);"
);
content = content.replace(
  "detectedSegments,\n      activeSegmentId: null,",
  "detectedSegments: newDetectedSegments,\n      activeSegmentId: null,"
);

fs.writeFileSync('src/store/useAppStore.ts', content);
