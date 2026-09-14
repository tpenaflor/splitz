import re

with open('src/components/TelemetryChart.tsx', 'r') as f:
    content = f.read()

# Replace the mangled section
bad_section_regex = re.compile(r"\{\/\* Smoothing Selector \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div className=\"flex-1 min-h-0 relative\">")

good_section = """{/* Smoothing Selector */}
            <div className="border-l border-gray-700 pl-2 ml-1 flex gap-1">
              {[0, 5, 10, 30].map(s => (
                <button
                  key={s}
                  onClick={() => setSmoothing(s)}
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${smoothing === s ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'}`}
                >
                  {s === 0 ? 'Raw' : `${s}s`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Legend / Stats */}
        <div className="flex gap-6">
          {activities.map(act => {
            const s = stats[act.id];
            return (
              <div key={act.id} className="flex flex-col text-xs" style={{ color: act.color }}>
                <div className="font-bold mb-1 border-b border-gray-700 pb-0.5">{act.name}</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-400">
                  <span>LIVE: <span className="text-white font-mono">{s.current !== null ? Math.round(s.current) : '-'}</span> {activeUnit}</span>
                  <span>AVG: <span className="text-gray-200 font-mono">{Math.round(s.avg)}</span> {activeUnit}</span>
                  <span>MIN: <span className="text-gray-200 font-mono">{Math.round(s.min)}</span> {activeUnit}</span>
                  <span>MAX: <span className="text-gray-200 font-mono">{Math.round(s.max)}</span> {activeUnit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex-1 min-h-0 relative">"""

content = re.sub(bad_section_regex, good_section, content)

with open('src/components/TelemetryChart.tsx', 'w') as f:
    f.write(content)

