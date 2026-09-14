const fs = require('fs');
let content = fs.readFileSync('src/components/Timeline.tsx', 'utf-8');

content = content.replace(
  'className="w-full bg-gray-900 border-t border-gray-800 p-4 flex flex-col gap-4"',
  'className="w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-4"'
);

content = content.replace(
  'className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"',
  'className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"'
);

content = content.replace(
  'className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 outline-none focus:border-purple-500"',
  'className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded px-3 py-2 outline-none focus:border-purple-500"'
);

content = content.replace(
  /className="p-2 text-white hover:bg-gray-800 rounded-full transition-colors"/g,
  'className="p-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"'
);

fs.writeFileSync('src/components/Timeline.tsx', content);
