const fs = require('fs');
let content = fs.readFileSync('src/components/TelemetryChart.tsx', 'utf-8');

// Add useNP state
content = content.replace(
  "const [activeMetric, setActiveMetric] = useState<MetricType>('power');",
  "const [activeMetric, setActiveMetric] = useState<MetricType>('power');\n  const [useNP, setUseNP] = useState(false);"
);

// Update chartData computation
const oldData = `let val = act.positions[idx][activeMetric];
            if (activeMetric === 'speed' && val) val = val * 3.6;
            point[act.id] = val;`;

const newData = `let val = act.positions[idx][activeMetric];
            if (activeMetric === 'power' && useNP) val = act.positions[idx].normalizedPower || val;
            if (activeMetric === 'speed' && val) val = val * 3.6;
            point[act.id] = val;`;

content = content.replace(oldData, newData);

// Update activeUnit
content = content.replace(
  "const activeUnit = METRICS.find(m => m.key === activeMetric)?.unit || '';",
  "const activeUnit = METRICS.find(m => m.key === activeMetric)?.unit || '';\n  const activeLabel = METRICS.find(m => m.key === activeMetric)?.label || '';"
);

// Update header
content = content.replace(
  '<span className="text-gray-300 font-bold">{METRICS.find(m => m.key === activeMetric)?.label}</span>',
  '<span className="text-gray-300 font-bold">{activeLabel}{activeMetric === "power" && useNP ? " (NP)" : ""}</span>'
);

// Add toggle button next to tabs
const oldTabs = `            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setActiveMetric(m.key)}
                className={\`text-xs px-2 py-1 rounded transition-colors \${activeMetric === m.key ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}\`}
              >
                {m.label}
              </button>
            ))}
          </div>`;

const newTabs = `            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setActiveMetric(m.key)}
                className={\`text-xs px-2 py-1 rounded transition-colors \${activeMetric === m.key ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}\`}
              >
                {m.label}
              </button>
            ))}
            {activeMetric === 'power' && (
              <div className="border-l border-gray-700 pl-2 ml-1">
                <button
                  onClick={() => setUseNP(!useNP)}
                  className={\`text-[10px] px-2 py-1 rounded-full font-bold transition-colors \${useNP ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'}\`}
                  title="Toggle Normalized Power (30s Rolling)"
                >
                  NP
                </button>
              </div>
            )}
          </div>`;

content = content.replace(oldTabs, newTabs);

fs.writeFileSync('src/components/TelemetryChart.tsx', content);
