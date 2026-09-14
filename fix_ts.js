const fs = require('fs');
let content = fs.readFileSync('src/store/useAppStore.ts', 'utf-8');

content = content.replace(
  "currentTime: (state.currentTime === null || state.currentTime < minTime) ? minTime : state.currentTime,",
  "currentTime: (state.currentTime === null || (minTime !== null && state.currentTime < minTime)) ? minTime : state.currentTime,"
);

content = content.replace(
  "currentTime: (state.currentTime && state.currentTime > maxTime) ? maxTime : state.currentTime,",
  "currentTime: (state.currentTime !== null && maxTime !== null && state.currentTime > maxTime) ? maxTime : state.currentTime,"
);

fs.writeFileSync('src/store/useAppStore.ts', content);
