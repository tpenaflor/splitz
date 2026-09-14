import re

with open('src/components/Sidebar.tsx', 'r') as f:
    content = f.read()

# Add Shield icon
content = content.replace(
    "Trash2 } from 'lucide-react';",
    "Trash2, Shield } from 'lucide-react';"
)

# Extract privacyMode from store
content = content.replace(
    "segmentRange, setSegmentRange, setAppMode, extractSegment, deleteSegment",
    "segmentRange, setSegmentRange, setAppMode, extractSegment, deleteSegment, privacyMode, setPrivacyMode"
)

# Insert toggle UI right before activities map
old_activities = """      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activities.map(activity => ("""

new_activities = """      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {appMode === 'event' && activities.length > 1 && detectedSegments.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between border border-gray-700">
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${privacyMode ? 'text-green-400' : 'text-gray-500'}`} />
              <span className="text-sm font-medium text-gray-200">Meetup Privacy Zone</span>
            </div>
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${privacyMode ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${privacyMode ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        )}
        
        {activities.map(activity => ("""

content = content.replace(old_activities, new_activities)

with open('src/components/Sidebar.tsx', 'w') as f:
    f.write(content)

