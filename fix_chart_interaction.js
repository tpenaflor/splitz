const fs = require('fs');
let content = fs.readFileSync('src/components/TelemetryChart.tsx', 'utf-8');

// Add useRef
content = content.replace("import { useMemo, useState } from 'react';", "import { useMemo, useState, useRef } from 'react';");

// Add drag state inside component
content = content.replace("const [activeMetric, setActiveMetric] = useState<MetricType>('power');", "const [activeMetric, setActiveMetric] = useState<MetricType>('power');\n  const isDragging = useRef(false);");

// Update ComposedChart
const newChart = `
        <div 
          className="w-full h-full"
          onMouseDown={() => isDragging.current = true}
          onMouseUp={() => isDragging.current = false}
          onMouseLeave={() => isDragging.current = false}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={chartData} 
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              onClick={(e) => {
                if (e && e.activeLabel !== undefined) {
                  const t = Number(e.activeLabel);
                  if (appMode === 'event') {
                    const minT = Math.min(...activities.map(a => a.startTime));
                    setCurrentTime(minT + t);
                  } else {
                    setCurrentTime(t);
                  }
                }
              }}
              onMouseMove={(e) => {
                if (isDragging.current && e && e.activeLabel !== undefined) {
                  const t = Number(e.activeLabel);
                  if (appMode === 'event') {
                    const minT = Math.min(...activities.map(a => a.startTime));
                    setCurrentTime(minT + t);
                  } else {
                    setCurrentTime(t);
                  }
                }
              }}
              style={{ cursor: 'crosshair' }}
            >
`;

content = content.replace(/<ResponsiveContainer width="100%" height="100%">\s*<ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>/, newChart);
content = content.replace(/<\/ResponsiveContainer>\s*<\/div>/, "</ComposedChart>\n          </ResponsiveContainer>\n        </div>\n      </div>"); // Fix closing tags

fs.writeFileSync('src/components/TelemetryChart.tsx', content);
