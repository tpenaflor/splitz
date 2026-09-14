const fs = require('fs');
const content = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

// The botched replacement inserted the button inside the leaderboard map.
// I will just replace the whole leaderboard div back to its correct state
// and insert the button inside the `segmentRange && activities[0]` block.

let newContent = content.replace(/<div className="space-y-2">\s*<label className="text-xs text-gray-400">Trim Segment Start \/ End<\/label>[\s\S]*?{useAppStore\.getState\(\)\.segmentResults\.sort\(\(a, b\) => a\.duration - b\.duration\)\.map\(\(res, i\) => {[\s\S]*?}\)}/,
`
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">Trim Segment Start / End</label>
                      <div className="flex gap-2">
                        <input 
                          type="range" 
                          min={seg.startIndex} 
                          max={segmentRange[1] - 1} 
                          value={segmentRange[0]} 
                          onChange={(e) => setSegmentRange([parseInt(e.target.value), segmentRange[1]])}
                          className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none accent-purple-500"
                        />
                        <input 
                          type="range" 
                          min={segmentRange[0] + 1} 
                          max={seg.endIndex} 
                          value={segmentRange[1]} 
                          onChange={(e) => setSegmentRange([segmentRange[0], parseInt(e.target.value)])}
                          className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none accent-purple-500"
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          useAppStore.getState().extractSegment();
                        }}
                        className="w-full mt-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium rounded transition-colors"
                      >
                        Save as New Segment
                      </button>
                    </div>
                  )}

                  {/* Leaderboard for active segment */}
                  <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
                    <h4 className="text-xs text-gray-400 uppercase">Leaderboard</h4>
                    {useAppStore.getState().segmentResults.sort((a, b) => a.duration - b.duration).map((res, i) => {
`);
// wait, the regex replacement might be tricky. Let's just use simple search and replace string.

fs.writeFileSync('src/components/Sidebar.tsx', newContent);
