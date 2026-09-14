const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

// Add Settings icon to imports
content = content.replace(
  "import { Upload, X, Map as MapIcon, Calendar, Activity, Play, Pause, FastForward, Trash2, Shield } from 'lucide-react';",
  "import { Upload, X, Map as MapIcon, Calendar, Activity, Play, Pause, FastForward, Trash2, Settings } from 'lucide-react';"
);

// Add setIsSettingsOpen to store extraction
content = content.replace(
  "segmentRange, setSegmentRange, setAppMode, extractSegment, deleteSegment, privacyMode, setPrivacyMode",
  "segmentRange, setSegmentRange, setAppMode, extractSegment, deleteSegment, setIsSettingsOpen"
);

// Add Settings gear to header
const oldHeader = `    <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Strava Live Comparison
        </h1>`;

const newHeader = `    <div className="w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-hidden transition-colors duration-200">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-600 dark:from-purple-400 dark:to-pink-600">
            Strava Live Comparison
          </h1>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>`;

content = content.replace(oldHeader, newHeader);

// Remove the old Privacy Zone toggle
const oldToggleRegex = /\{appMode === 'event' && activities\.length > 1 && detectedSegments\.length > 0 && \([\s\S]*?\}\)\}/;
content = content.replace(oldToggleRegex, "");

fs.writeFileSync('src/components/Sidebar.tsx', content);
