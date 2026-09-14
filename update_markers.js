const fs = require('fs');
let content = fs.readFileSync('src/components/MapComponent.tsx', 'utf-8');

// Check if Flag is imported
if (!content.includes('import { Flag }')) {
  // If lucide-react is not imported in MapComponent, we need to import it
  if (content.includes('lucide-react')) {
    content = content.replace("from 'lucide-react';", "Flag, from 'lucide-react';");
  } else {
    content = content.replace("import Map", "import { Flag } from 'lucide-react';\nimport Map");
  }
}

const renderMarkers = `
        {/* Start / Finish Markers */}
        {startFinishMarkers && startFinishMarkers.start && (
          <Marker longitude={startFinishMarkers.start.lon} latitude={startFinishMarkers.start.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <div className="bg-green-500 rounded-full p-1 shadow-lg border-2 border-white">
                <Flag className="w-3 h-3 text-white" fill="currentColor" />
              </div>
              <div className="w-0.5 h-4 bg-white/50 mx-auto mt-0.5"></div>
            </div>
          </Marker>
        )}
        {startFinishMarkers && startFinishMarkers.end && (
          <Marker longitude={startFinishMarkers.end.lon} latitude={startFinishMarkers.end.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <div className="text-xl drop-shadow-md leading-none" title="Finish Line">🏁</div>
              <div className="w-0.5 h-4 bg-white/50 mx-auto mt-0.5"></div>
            </div>
          </Marker>
        )}
`;

content = content.replace(
  /{\/\* Start \/ Finish Markers \*\/}[\s\S]*?{\/\* Draw Current Position Markers \*\//,
  renderMarkers.trim() + "\n\n        {/* Draw Current Position Markers */"
);

fs.writeFileSync('src/components/MapComponent.tsx', content);
