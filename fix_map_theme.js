const fs = require('fs');
let content = fs.readFileSync('src/components/MapComponent.tsx', 'utf-8');

// Add theme to store extraction
content = content.replace(
  "const { activities, currentTime, appMode, segmentResults, activeSegmentId, detectedSegments, segmentRange, minTime, maxTime } = useAppStore();",
  "const { activities, currentTime, appMode, segmentResults, activeSegmentId, detectedSegments, segmentRange, minTime, maxTime, theme } = useAppStore();"
);

// Toggle Map style
content = content.replace(
  'mapStyle="mapbox://styles/mapbox/dark-v11"',
  'mapStyle={theme === \'dark\' ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"}'
);

fs.writeFileSync('src/components/MapComponent.tsx', content);
