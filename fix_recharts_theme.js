const fs = require('fs');
let content = fs.readFileSync('src/components/TelemetryChart.tsx', 'utf-8');

// Add theme to store extraction
content = content.replace(
  "const { activities, appMode, activeSegmentId, segmentResults, currentTime, segmentRange, minTime, maxTime } = useAppStore();",
  "const { activities, appMode, activeSegmentId, segmentResults, currentTime, segmentRange, minTime, maxTime, theme } = useAppStore();"
);

content = content.replace(
  'stroke="var(--color-gray-700, #374151)"',
  'stroke={theme === \'dark\' ? "#374151" : "#E5E7EB"}'
);
content = content.replace(
  'stroke="#9CA3AF"',
  'stroke={theme === \'dark\' ? "#9CA3AF" : "#6B7280"}'
);
content = content.replace(
  'fill="#374151"',
  'fill={theme === \'dark\' ? "#374151" : "#E5E7EB"}'
);

fs.writeFileSync('src/components/TelemetryChart.tsx', content);
