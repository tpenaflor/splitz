const fs = require('fs');
let content = fs.readFileSync('src/store/useAppStore.ts', 'utf-8');

const oldLine = `    if (!id) return { activeSegmentId: null, segmentResults: [], baseSegmentResults: [], segmentRange: null, minTime: null, maxTime: null, currentTime: null, isPlaying: false };`;

const newLine = `    if (!id) {
      if (state.activities.length === 0) return { activeSegmentId: null, segmentResults: [], baseSegmentResults: [], segmentRange: null, minTime: null, maxTime: null, currentTime: null, isPlaying: false };
      const allStartTimes = state.activities.map(a => a.startTime);
      const allEndTimes = state.activities.map(a => a.endTime);
      const minTime = Math.min(...allStartTimes);
      const maxTime = Math.max(...allEndTimes);
      return { 
        activeSegmentId: null, 
        segmentResults: [], 
        baseSegmentResults: [], 
        segmentRange: null, 
        minTime, 
        maxTime, 
        currentTime: minTime, 
        isPlaying: false 
      };
    }`;

content = content.replace(oldLine, newLine);
fs.writeFileSync('src/store/useAppStore.ts', content);
