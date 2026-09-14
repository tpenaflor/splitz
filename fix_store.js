const fs = require('fs');
let content = fs.readFileSync('src/store/useAppStore.ts', 'utf-8');

// Add baseSegmentResults to the interface
content = content.replace(
  'segmentResults: ActivitySegmentResult[];',
  'segmentResults: ActivitySegmentResult[];\n  baseSegmentResults: ActivitySegmentResult[];'
);

// Add to initial state
content = content.replace(
  'segmentResults: [],',
  'segmentResults: [],\n  baseSegmentResults: [],'
);

// Add to addActivity return
content = content.replace(
  'segmentResults: []\n    };',
  'segmentResults: [],\n      baseSegmentResults: []\n    };'
);

// Add to removeActivity return
content = content.replace(
  'segmentResults: []\n    };',
  'segmentResults: [],\n      baseSegmentResults: []\n    };'
);
content = content.replace(
  'activeSegmentId: null, segmentResults: [] };',
  'activeSegmentId: null, segmentResults: [], baseSegmentResults: [] };'
);

// Add to setActiveSegment early return
content = content.replace(
  'activeSegmentId: null, segmentResults: [], segmentRange: null',
  'activeSegmentId: null, segmentResults: [], baseSegmentResults: [], segmentRange: null'
);

// Add to setActiveSegment return
content = content.replace(
  'segmentResults: results,\n      minTime: 0,',
  'segmentResults: results,\n      baseSegmentResults: results,\n      minTime: 0,'
);

// Modify setSegmentRange call
const oldSetSegment = `
    const results = computeSegmentResults(
      state.activities, 
      ref.positions[range[0]], 
      ref.positions[range[1]], 
      trimmedLengthMeters
    );
`;

const newSetSegment = `
    const constraints: Record<string, { minTime: number, maxTime: number }> = {};
    if (state.baseSegmentResults) {
      state.baseSegmentResults.forEach(r => {
        constraints[r.activityId] = { minTime: r.startTime - 120, maxTime: r.endTime + 120 };
      });
    }

    const results = computeSegmentResults(
      state.activities, 
      ref.positions[range[0]], 
      ref.positions[range[1]], 
      trimmedLengthMeters,
      constraints
    );
`;

content = content.replace(oldSetSegment.trim(), newSetSegment.trim());

fs.writeFileSync('src/store/useAppStore.ts', content);
