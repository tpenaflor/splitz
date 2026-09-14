const fs = require('fs');
let content = fs.readFileSync('src/components/Uploader.tsx', 'utf-8');

content = content.replace(
  /'border-gray-600 bg-gray-800'/g,
  "'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'"
);
content = content.replace(
  'className="w-12 h-12 text-gray-400 mb-4"',
  'className="w-12 h-12 text-gray-400 mb-4"' // fine as is
);
content = content.replace(
  'className="text-gray-200 font-medium"',
  'className="text-gray-700 dark:text-gray-200 font-medium"'
);

fs.writeFileSync('src/components/Uploader.tsx', content);
