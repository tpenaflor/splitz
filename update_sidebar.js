const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

// Ensure Trash2 icon is imported
if (!content.includes('Trash2')) {
  content = content.replace('Play, Pause,', 'Play, Pause, Trash2,');
}

// Update the segment name display and delete button
const oldSegmentRender = `
          detectedSegments.map((seg, idx) => (
            <div key={seg.id} className={\`bg-gray-800 rounded-lg p-4 border transition-colors \${activeSegmentId === seg.id ? 'border-purple-500' : 'border-gray-700 cursor-pointer hover:border-gray-500'}\`}>
              {activeSegmentId !== seg.id ? (
                <div onClick={() => setActiveSegment(seg.id)} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-purple-400" />
                    <span className="text-white font-medium">Segment {idx + 1}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{(seg.lengthMeters / 1000).toFixed(2)} km</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 font-bold">Segment {idx + 1} (Active)</span>
                    <button onClick={() => setActiveSegment(null)}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
                  </div>
`;

const newSegmentRender = `
          detectedSegments.map((seg, idx) => (
            <div key={seg.id} className={\`bg-gray-800 rounded-lg p-4 border transition-colors \${activeSegmentId === seg.id ? 'border-purple-500' : 'border-gray-700 cursor-pointer hover:border-gray-500'}\`}>
              {activeSegmentId !== seg.id ? (
                <div onClick={() => setActiveSegment(seg.id)} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-purple-400" />
                    <span className="text-white font-medium">{seg.name || \`Segment \${idx + 1}\`}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">{(seg.lengthMeters / 1000).toFixed(2)} km</span>
                    {seg.isCustom && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); useAppStore.getState().deleteSegment(seg.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete segment"
                      >
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 font-bold">{seg.name || \`Segment \${idx + 1}\`} (Active)</span>
                    <div className="flex items-center gap-2">
                      {seg.isCustom && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); useAppStore.getState().deleteSegment(seg.id); }}
                          title="Delete segment"
                        >
                          <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                        </button>
                      )}
                      <button onClick={() => setActiveSegment(null)}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
                    </div>
                  </div>
`;

content = content.replace(oldSegmentRender.trim(), newSegmentRender.trim());

fs.writeFileSync('src/components/Sidebar.tsx', content);
