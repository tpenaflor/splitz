const fs = require('fs');
let content = fs.readFileSync('src/store/useAppStore.ts', 'utf-8');

// 1. Add privacyMode to AppState
content = content.replace(
  "appMode: 'event' | 'segment';",
  "appMode: 'event' | 'segment';\n  privacyMode: boolean;"
);
content = content.replace(
  "deleteSegment: (id: string) => void;",
  "deleteSegment: (id: string) => void;\n  setPrivacyMode: (val: boolean) => void;"
);

// 2. Add computeEventBounds helper
const helper = `
const PRIVACY_BUFFER_SECONDS = 180;

function computeEventBounds(activities: ActivityData[], segments: DetectedSegment[], privacyMode: boolean) {
  if (activities.length === 0) return { minTime: null, maxTime: null };
  const allStartTimes = activities.map(a => a.startTime);
  const allEndTimes = activities.map(a => a.endTime);
  
  if (!privacyMode || segments.length === 0) {
    return {
      minTime: Math.min(...allStartTimes),
      maxTime: Math.max(...allEndTimes)
    };
  }

  const ref = activities[0];
  let firstMeetup = Infinity;
  let lastSeparation = -Infinity;
  
  for (const seg of segments) {
    if (seg.startIndex >= 0 && seg.startIndex < ref.positions.length) {
      const sTime = ref.positions[seg.startIndex].time;
      if (sTime < firstMeetup) firstMeetup = sTime;
    }
    if (seg.endIndex >= 0 && seg.endIndex < ref.positions.length) {
      const eTime = ref.positions[seg.endIndex].time;
      if (eTime > lastSeparation) lastSeparation = eTime;
    }
  }
  
  if (firstMeetup === Infinity || lastSeparation === -Infinity) {
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

content = content.replace('export const useAppStore = create', helper + '\nexport const useAppStore = create');

// 3. Initialize privacyMode
content = content.replace(
  "appMode: 'event',",
  "appMode: 'event',\n  privacyMode: true,"
);

// 4. Update addActivity
content = content.replace(
  "const minTime = Math.min(...allStartTimes);\n    const maxTime = Math.max(...allEndTimes);",
  "const { minTime, maxTime } = computeEventBounds(newActivities, detectedSegments, state.privacyMode);"
);

// 5. Update removeActivity
content = content.replace(
  "const minTime = Math.min(...allStartTimes);\n    const maxTime = Math.max(...allEndTimes);",
  "const { minTime, maxTime } = computeEventBounds(newActivities, detectedSegments, state.privacyMode);"
);

// 6. Update setAppMode
content = content.replace(
  "setAppMode: (mode) => set({ appMode: mode }),",
  "setAppMode: (mode) => set((state) => {\n    if (mode === 'event') {\n      const { minTime, maxTime } = computeEventBounds(state.activities, state.detectedSegments, state.privacyMode);\n      return { appMode: mode, minTime, maxTime, currentTime: minTime, activeSegmentId: null };\n    }\n    return { appMode: mode };\n  }),"
);

// 7. Update setActiveSegment(null) to use helper instead of old manual bounds
const oldSetActiveSegmentNull = `    if (!id) {
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

const newSetActiveSegmentNull = `    if (!id) {
      const { minTime, maxTime } = computeEventBounds(state.activities, state.detectedSegments, state.privacyMode);
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

content = content.replace(oldSetActiveSegmentNull, newSetActiveSegmentNull);

// 8. Add setPrivacyMode action
content = content.replace(
  "deleteSegment: (id) => set((state) => ({",
  "setPrivacyMode: (val) => set((state) => {\n    const updates: any = { privacyMode: val };\n    if (state.appMode === 'event') {\n      const { minTime, maxTime } = computeEventBounds(state.activities, state.detectedSegments, val);\n      updates.minTime = minTime;\n      updates.maxTime = maxTime;\n      if (state.currentTime && minTime && state.currentTime < minTime) updates.currentTime = minTime;\n      if (state.currentTime && maxTime && state.currentTime > maxTime) updates.currentTime = maxTime;\n    }\n    return updates;\n  }),\n  deleteSegment: (id) => set((state) => ({"
);

fs.writeFileSync('src/store/useAppStore.ts', content);
