const fs = require('fs');
let content = fs.readFileSync('src/components/TelemetryChart.tsx', 'utf-8');

content = content.replace(
  'className="h-64 bg-gray-900 border-t border-gray-800 p-2 flex flex-col relative z-20"',
  'className="h-64 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-2 flex flex-col relative z-20"'
);

content = content.replace(
  /'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'/g,
  "'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
);

content = content.replace(
  'className="border-l border-gray-700 pl-2 ml-1 flex gap-1"',
  'className="border-l border-gray-200 dark:border-gray-700 pl-2 ml-1 flex gap-1"'
);

content = content.replace(
  /'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'/g,
  "'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 hover:text-gray-700 dark:hover:text-gray-300'"
);

content = content.replace(
  'className="font-bold mb-1 border-b border-gray-700 pb-0.5"',
  'className="font-bold mb-1 border-b border-gray-200 dark:border-gray-700 pb-0.5"'
);

content = content.replace(
  'className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-400"',
  'className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-500 dark:text-gray-400"'
);

content = content.replace(
  /className="text-white font-mono"/g,
  'className="text-gray-900 dark:text-white font-mono"'
);

content = content.replace(
  /className="text-gray-200 font-mono"/g,
  'className="text-gray-700 dark:text-gray-200 font-mono"'
);

// CartesianGrid stroke color
content = content.replace(
  'stroke="#374151"',
  'stroke="var(--color-gray-700, #374151)"' // Actually Recharts doesn't handle css vars perfectly sometimes, but it usually works if we provide fallback. Or we could pass it dynamically from store!
);

fs.writeFileSync('src/components/TelemetryChart.tsx', content);
