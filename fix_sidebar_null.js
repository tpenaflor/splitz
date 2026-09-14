const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

// Replace {segmentRange[0]} with {segmentRange?.[0] ?? 0}
content = content.replace(/segmentRange\[0\]/g, '(segmentRange?.[0] ?? 0)');
content = content.replace(/segmentRange\[1\]/g, '(segmentRange?.[1] ?? 100)');

fs.writeFileSync('src/components/Sidebar.tsx', content);
