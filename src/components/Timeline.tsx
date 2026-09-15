"use client";

import { useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

function formatTime(unixSeconds: number, mode: 'event' | 'segment') {
  if (mode === 'segment') {
    // Relative time: MM:SS
    const mins = Math.floor(unixSeconds / 60);
    const secs = Math.floor(unixSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    // Absolute time
    const d = new Date(unixSeconds * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}

export default function Timeline() {
  const { 
    minTime, maxTime, currentTime, isPlaying, playbackSpeed, appMode,
    setCurrentTime, setIsPlaying, setPlaybackSpeed 
  } = useAppStore();

  const requestRef = useRef<number>(0);
  const lastUpdateRef = useRef<number | undefined>(undefined);

  const animate = (time: number) => {
    if (lastUpdateRef.current !== undefined) {
      const deltaMs = time - lastUpdateRef.current;
      const deltaSec = deltaMs / 1000;
      
      const store = useAppStore.getState();
      if (store.isPlaying && store.currentTime !== null && store.maxTime !== null && store.minTime !== null) {
        const newTime = store.currentTime + (deltaSec * store.playbackSpeed);
        if (newTime >= store.maxTime) {
          store.setCurrentTime(store.maxTime);
          store.setIsPlaying(false);
        } else {
          store.setCurrentTime(newTime);
        }
      }
    }
    lastUpdateRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  if (minTime === null || maxTime === null || currentTime === null) return null;

  return (
    <div className="w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-2 md:p-4 flex flex-col gap-2 md:gap-4">
      <div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-4">
        <button 
          onClick={() => {
            if (!isPlaying && currentTime >= maxTime) {
              setCurrentTime(minTime);
            }
            setIsPlaying(!isPlaying);
          }}
          className="p-2 md:p-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0 transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5" /> : <Play className="w-4 h-4 md:w-5 md:h-5" />}
        </button>
        
        <div className="flex-1 flex items-center gap-2 md:gap-4 min-w-[200px]">
          <span className="text-gray-400 text-xs md:text-sm font-mono">{formatTime(minTime, appMode)}</span>
          <input 
            type="range" 
            min={minTime} 
            max={maxTime} 
            value={currentTime} 
            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
            onMouseDown={() => setIsPlaying(false)}
            onTouchStart={() => setIsPlaying(false)}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <span className="text-gray-400 text-xs md:text-sm font-mono">{formatTime(maxTime, appMode)}</span>
        </div>

        <select 
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
          className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm md:text-base rounded px-2 py-1 md:px-3 md:py-2 outline-none focus:border-purple-500"
        >
          <option value={1}>1x</option>
          <option value={5}>5x</option>
          <option value={10}>10x</option>
          <option value={50}>50x</option>
          <option value={75}>75x</option>
          <option value={100}>100x</option>
          <option value={150}>150x</option>
          <option value={200}>200x</option>
        </select>
      </div>
      <div className="text-center text-purple-400 font-mono text-lg md:text-xl tracking-wider">
        {formatTime(currentTime, appMode)}
        {appMode === 'segment' && <span className="text-xs text-gray-500 ml-2">(Segment Time)</span>}
      </div>
    </div>
  );
}
