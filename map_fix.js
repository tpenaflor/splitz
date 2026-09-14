const fs = require('fs');
let content = fs.readFileSync('src/components/MapComponent.tsx', 'utf-8');

const markerLogic = `
  const startFinishMarkers = useMemo(() => {
    if (appMode === 'event') {
      if (activities.length === 0) return null;
      const ref = activities[0];
      return {
        start: ref.positions[0],
        end: ref.positions[ref.positions.length - 1]
      };
    } else {
      if (!activeSegmentId || !segmentRange || activities.length === 0) return null;
      const ref = activities[0];
      return {
        start: ref.positions[segmentRange[0]],
        end: ref.positions[segmentRange[1]]
      };
    }
  }, [appMode, activities, activeSegmentId, segmentRange]);
`;

content = content.replace(
  "  const currentPositions = useMemo(() => {",
  markerLogic + "\n  const currentPositions = useMemo(() => {"
);

const renderMarkers = `
        {/* Start / Finish Markers */}
        {startFinishMarkers && startFinishMarkers.start && (
          <Marker longitude={startFinishMarkers.start.lon} latitude={startFinishMarkers.start.lat} anchor="bottom">
            <div className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-green-800">START</div>
            <div className="w-0.5 h-3 bg-green-800 mx-auto"></div>
          </Marker>
        )}
        {startFinishMarkers && startFinishMarkers.end && (
          <Marker longitude={startFinishMarkers.end.lon} latitude={startFinishMarkers.end.lat} anchor="bottom">
            <div className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-red-800">FINISH</div>
            <div className="w-0.5 h-3 bg-red-800 mx-auto"></div>
          </Marker>
        )}
`;

content = content.replace(
  "        {/* Draw Current Position Markers */}",
  renderMarkers + "\n        {/* Draw Current Position Markers */}"
);

fs.writeFileSync('src/components/MapComponent.tsx', content);
