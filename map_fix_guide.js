const fs = require('fs');
let content = fs.readFileSync('src/components/MapComponent.tsx', 'utf-8');

const baseLogic = `
  const baseSegmentPaths = useMemo(() => {
    if (appMode !== 'segment' || !activeSegmentId) return [];
    const baseSeg = detectedSegments.find(s => s.id === activeSegmentId);
    if (!baseSeg || activities.length === 0) return [];
    
    const ref = activities[0];
    const pts = ref.positions.slice(baseSeg.startIndex, baseSeg.endIndex + 1);
    
    return [{
      id: 'base-segment-outline',
      color: '#9CA3AF',
      geojson: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: pts.map(p => [p.lon, p.lat])
        }
      }
    }];
  }, [appMode, activeSegmentId, detectedSegments, activities]);

  const activeSegmentPaths = useMemo(() => {
`;

content = content.replace("  const activeSegmentPaths = useMemo(() => {", baseLogic);

const renderBase = `
        {/* Segment Mode: Base segment track (drop zone outline) */}
        {appMode === 'segment' && baseSegmentPaths.map((path) => (
          <Source key={\`base-source-\${path.id}\`} id={\`base-source-\${path.id}\`} type="geojson" data={path.geojson}>
            <Layer 
              id={\`base-layer-\${path.id}\`} 
              type="line" 
              paint={{
                'line-color': path.color,
                'line-width': 8,
                'line-opacity': 0.4,
                'line-dasharray': [2, 2]
              }} 
            />
          </Source>
        ))}

        {/* Segment Mode: Draw only the active segment paths */}
`;

content = content.replace("        {/* Segment Mode: Draw only the active segment paths */}", renderBase);

fs.writeFileSync('src/components/MapComponent.tsx', content);
