const fs = require('fs');
let content = fs.readFileSync('src/components/MapComponent.tsx', 'utf-8');

const dragLogic = `
  const handleMarkerDragEnd = (e: any, type: 'start' | 'end') => {
    if (appMode !== 'segment' || !activeSegmentId || !segmentRange || activities.length === 0) return;
    
    const lng = e.lngLat.lng;
    const lat = e.lngLat.lat;
    
    const baseSeg = detectedSegments.find(s => s.id === activeSegmentId);
    if (!baseSeg) return;

    const ref = activities[0];
    let minDistance = Infinity;
    let closestIndex = type === 'start' ? segmentRange[0] : segmentRange[1];

    for (let i = baseSeg.startIndex; i <= baseSeg.endIndex; i++) {
      const p = ref.positions[i];
      const dx = p.lon - lng;
      const dy = p.lat - lat;
      const dist = dx * dx + dy * dy;
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    if (type === 'start') {
      if (closestIndex >= segmentRange[1]) closestIndex = segmentRange[1] - 1;
      useAppStore.getState().setSegmentRange([closestIndex, segmentRange[1]]);
    } else {
      if (closestIndex <= segmentRange[0]) closestIndex = segmentRange[0] + 1;
      useAppStore.getState().setSegmentRange([segmentRange[0], closestIndex]);
    }
  };

  const startFinishMarkers = useMemo(() => {
`;

content = content.replace("  const startFinishMarkers = useMemo(() => {", dragLogic);

content = content.replace(
  '<Marker longitude={startFinishMarkers.start.lon} latitude={startFinishMarkers.start.lat} anchor="bottom">',
  '<Marker longitude={startFinishMarkers.start.lon} latitude={startFinishMarkers.start.lat} anchor="bottom" draggable={appMode === "segment"} onDragEnd={(e) => handleMarkerDragEnd(e, "start")}>'
);

content = content.replace(
  '<Marker longitude={startFinishMarkers.end.lon} latitude={startFinishMarkers.end.lat} anchor="bottom">',
  '<Marker longitude={startFinishMarkers.end.lon} latitude={startFinishMarkers.end.lat} anchor="bottom" draggable={appMode === "segment"} onDragEnd={(e) => handleMarkerDragEnd(e, "end")}>'
);

// We need to add "cursor-grab active:cursor-grabbing" to the flag div so users know it's draggable
content = content.replace(
  '<div className="bg-green-500 rounded-full p-1 shadow-lg border-2 border-white">',
  '<div className="bg-green-500 rounded-full p-1 shadow-lg border-2 border-white cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">'
);
content = content.replace(
  '<div className="text-xl drop-shadow-md leading-none" title="Finish Line">🏁</div>',
  '<div className="text-xl drop-shadow-md leading-none cursor-grab active:cursor-grabbing hover:scale-110 transition-transform" title="Finish Line">🏁</div>'
);


fs.writeFileSync('src/components/MapComponent.tsx', content);
