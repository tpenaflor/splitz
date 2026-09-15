
"use client";

import { Upload, X, Map as MapIcon, Calendar, Activity, Play, Pause, FastForward, Trash2, Settings, Route, Shield, Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import Uploader from './Uploader';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { 
    activities, removeActivity, currentTime, appMode, 
    detectedSegments, activeSegmentId, setActiveSegment, 
    segmentRange, setSegmentRange, setAppMode, extractSegment, deleteSegment, setIsSettingsOpen, segmentResults
  } = useAppStore();

  const router = useRouter();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const handleCreateRoom = async () => {
    try {
      setIsCreatingRoom(true);
      const res = await fetch('/api/rooms', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create room');
      const data = await res.json();
      router.push(`/compare/${data.roomId}`);
    } catch (err) {
      console.error(err);
      alert('Could not create room.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-hidden transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0 md:w-96`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-600 dark:from-purple-400 dark:to-pink-600">
            Splitz
          </h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="md:hidden p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-4">
          <button 
            onClick={() => { setAppMode('event'); setActiveSegment(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${appMode === 'event' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
          >
            Event Sync
          </button>
          <button 
            onClick={() => setAppMode('segment')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${appMode === 'segment' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
          >
            Segments
          </button>
        </div>

        <button 
          onClick={handleCreateRoom}
          disabled={isCreatingRoom}
          className="w-full flex items-center justify-center gap-2 mb-4 py-2 px-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          <Users className="w-4 h-4" />
          {isCreatingRoom ? 'Creating...' : 'Create Activity Group'}
        </button>

        {/* Always show uploader */}
        <Uploader />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activities.map(activity => (
          <div key={`act-${activity.id}`} className="bg-white dark:bg-gray-800 rounded-lg p-3 relative border-l-4 border border-transparent dark:border-transparent flex items-center justify-between shadow-sm" style={{ borderColor: activity.color }}>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">{activity.name}</h3>
            <button onClick={() => removeActivity(activity.id)} className="text-gray-500 hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        <div className="border-t border-gray-200 dark:border-gray-800 my-4" />

        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Detected Shared Routes</h2>
        {detectedSegments.length === 0 ? (
          <div className="text-gray-500 text-sm">Upload at least two overlapping routes to detect segments.</div>
        ) : (
          detectedSegments.map((seg, idx) => (
            <div key={seg.id} className={`bg-white dark:bg-gray-800 rounded-lg p-4 border transition-colors ${activeSegmentId === seg.id ? 'border-purple-500' : 'border-gray-200 dark:border-gray-700 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 shadow-sm'}`}>
              {activeSegmentId !== seg.id ? (
                <div onClick={() => setActiveSegment(seg.id)} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-900 dark:text-white font-medium">{seg.name || `Segment ${idx + 1}`}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">{(seg.lengthMeters / 1000).toFixed(2)} km</span>
                    {seg.isCustom && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteSegment(seg.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete segment"
                      >
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 font-bold">{seg.name || `Segment ${idx + 1}`} (Active)</span>
                    <div className="flex items-center gap-2">
                      {seg.isCustom && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteSegment(seg.id); }}
                          title="Delete segment"
                        >
                          <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                        </button>
                      )}
                      <button onClick={() => setActiveSegment(null)}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
                    </div>
                  </div>
                  
                  {appMode === 'segment' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-gray-500 dark:text-gray-400">Trim Segment Start / End</label>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500 w-8">Start</span>
                        <input 
                          type="range" 
                          min={0} 
                          max={100} 
                          value={(segmentRange?.[0] ?? 0)}
                          onChange={(e) => setSegmentRange([Number(e.target.value), (segmentRange?.[1] ?? 100)])}
                          className="flex-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none accent-purple-500"
                        />
                        <span className="text-xs text-gray-500 w-8 text-right">{(segmentRange?.[0] ?? 0)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-8">End</span>
                        <input 
                          type="range" 
                          min={0} 
                          max={100} 
                          value={(segmentRange?.[1] ?? 100)}
                          onChange={(e) => setSegmentRange([(segmentRange?.[0] ?? 0), Number(e.target.value)])}
                          className="flex-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none accent-purple-500"
                        />
                        <span className="text-xs text-gray-500 w-8 text-right">{(segmentRange?.[1] ?? 100)}%</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <h4 className="text-xs text-gray-500 dark:text-gray-400 uppercase">Leaderboard</h4>
                    {segmentResults
                      .sort((a, b) => a.duration - b.duration)
                      .map((res, i) => {
                        const act = activities.find(a => a.id === res.activityId);
                        if (!act) return null;
                        return (
                          <div key={res.activityId} className="flex justify-between items-center text-sm p-2 bg-gray-100 dark:bg-gray-900 rounded border-l-2" style={{ borderColor: act.color }}>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-4">{i + 1}.</span>
                              <span className="text-gray-700 dark:text-gray-200 truncate max-w-[120px]">{act.name}</span>
                            </div>
                            <span className="font-mono font-bold text-purple-400">{formatDuration(res.duration)}</span>
                          </div>
                        );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
