const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

// Header tabs bg
content = content.replace(
  'className="flex bg-gray-800 rounded-lg p-1 mb-4"',
  'className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-4"'
);

// Tab buttons
content = content.replace(
  /'text-gray-400 hover:text-white'/g,
  "'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'"
);

// Activities container
content = content.replace(
  'className="bg-gray-800 rounded-lg p-3 relative border-l-4 flex items-center justify-between"',
  'className="bg-white dark:bg-gray-800 rounded-lg p-3 relative border-l-4 border border-transparent dark:border-transparent flex items-center justify-between shadow-sm"'
);
content = content.replace(
  'className="font-semibold text-white truncate text-sm"',
  'className="font-semibold text-gray-900 dark:text-white truncate text-sm"'
);

// Separator
content = content.replace(
  'className="border-t border-gray-800 my-4"',
  'className="border-t border-gray-200 dark:border-gray-800 my-4"'
);

// Detected Shared Routes header
content = content.replace(
  'className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2"',
  'className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"'
);

// Empty state
content = content.replace(
  'className="text-gray-500 text-sm"',
  'className="text-gray-500 text-sm"'
);

// Segments mapping
content = content.replace(
  /'border-gray-700 cursor-pointer hover:border-gray-500'/g,
  "'border-gray-200 dark:border-gray-700 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800 shadow-sm'"
);

content = content.replace(
  'className="font-bold text-white"',
  'className="font-bold text-gray-900 dark:text-white"'
);

// Trim border
content = content.replace(
  'className="mt-4 pt-4 border-t border-gray-700"',
  'className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"'
);

// Input sliders
content = content.replace(
  /className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none accent-purple-500"/g,
  'className="flex-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none accent-purple-500"'
);

// Leaderboard border
content = content.replace(
  'className="mt-4 pt-4 border-t border-gray-700 space-y-2"',
  'className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2"'
);
content = content.replace(
  'className="text-gray-200 truncate max-w-[120px]"',
  'className="text-gray-700 dark:text-gray-200 truncate max-w-[120px]"'
);

fs.writeFileSync('src/components/Sidebar.tsx', content);
