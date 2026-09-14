const fs = require('fs');
let content = fs.readFileSync('src/components/TelemetryChart.tsx', 'utf-8');

// Replace useNP with smoothing state
content = content.replace(
  'const [useNP, setUseNP] = useState(false);',
  'const [smoothing, setSmoothing] = useState<number>(0);'
);

// Remove useNP from dependencies
content = content.replace(
  ', useNP]);',
  ', smoothing]);'
);

// Helper function to replace extraction logic
const replaceExtraction = (content) => {
  const regex = /let val = act\.positions\[idx\]\[activeMetric\];[\s\S]*?if \(activeMetric === 'speed' && val\) val = val \* 3\.6;/g;
  return content.replace(regex, \`
            let val = act.positions[idx][activeMetric];
            if (smoothing > 0 && typeof val === 'number') {
              let sum = 0;
              let count = 0;
              for (let j = idx; j >= Math.max(0, idx - smoothing); j--) {
                const v = act.positions[j][activeMetric];
                if (typeof v === 'number') {
                  sum += v;
                  count++;
                }
              }
              val = count > 0 ? sum / count : val;
            }
            if (activeMetric === 'speed' && val) val = val * 3.6;
  \`.trim());
};

content = replaceExtraction(content);

// Update header
content = content.replace(
  '{activeMetric === "power" && useNP ? " (NP)" : ""}',
  '{smoothing > 0 ? \` (\${smoothing}s avg)\` : ""}'
);

// Update Tabs and add Smoothing Selector
const oldTabsRegex = /\{activeMetric === 'power' && \([\s\S]*?\}\)\}\s*<\/div>/g;
const newTabs = \`
            {/* Smoothing Selector */}
            <div className="border-l border-gray-700 pl-2 ml-1 flex gap-1">
              {[0, 5, 10, 30].map(s => (
                <button
                  key={s}
                  onClick={() => setSmoothing(s)}
                  className={\`text-[10px] px-2 py-1 rounded transition-colors \${smoothing === s ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'}\`}
                >
                  {s === 0 ? 'Raw' : \`\${s}s\`}
                </button>
              ))}
            </div>
          </div>
\`;
content = content.replace(oldTabsRegex, newTabs.trim());

fs.writeFileSync('src/components/TelemetryChart.tsx', content);
