import re

with open('src/components/MapComponent.tsx', 'r') as f:
    content = f.read()

# Add minTime and maxTime to useAppStore
content = content.replace(
    "const { activities, currentTime, appMode, segmentResults, activeSegmentId, detectedSegments, segmentRange } = useAppStore();",
    "const { activities, currentTime, appMode, segmentResults, activeSegmentId, detectedSegments, segmentRange, minTime, maxTime } = useAppStore();"
)

# Update start/end markers for event mode
old_markers = """    if (appMode === 'event') {
      if (activities.length === 0) return null;
      const ref = activities[0];
      return {
        start: ref.positions[0],
        end: ref.positions[ref.positions.length - 1]
      };
    }"""

new_markers = """    if (appMode === 'event') {
      if (activities.length === 0) return null;
      const ref = activities[0];
      let startPos = ref.positions[0];
      let endPos = ref.positions[ref.positions.length - 1];
      if (minTime !== null && maxTime !== null) {
        const sIdx = ref.positions.findIndex(p => p.time >= minTime);
        if (sIdx !== -1) startPos = ref.positions[sIdx];
        
        let eIdx = -1;
        for (let i = ref.positions.length - 1; i >= 0; i--) {
          if (ref.positions[i].time <= maxTime) {
            eIdx = i;
            break;
          }
        }
        if (eIdx !== -1) endPos = ref.positions[eIdx];
      }
      return {
        start: startPos,
        end: endPos
      };
    }"""

content = content.replace(old_markers, new_markers)

# Update the Map drawing
old_geojson = """        {appMode === 'event' && activities.map((activity) => {
          const geojson = {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: activity.positions.map(p => [p.lon, p.lat])
            }
          };"""

new_geojson = """        {appMode === 'event' && activities.map((activity) => {
          const filteredPositions = (minTime !== null && maxTime !== null) 
            ? activity.positions.filter(p => p.time >= minTime && p.time <= maxTime)
            : activity.positions;
            
          const geojson = {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: filteredPositions.map(p => [p.lon, p.lat])
            }
          };"""

content = content.replace(old_geojson, new_geojson)

with open('src/components/MapComponent.tsx', 'w') as f:
    f.write(content)

