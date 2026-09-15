"use client";

import { useMemo, useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area } from 'recharts';

type MetricType = 'heartRate' | 'power' | 'speed' | 'cadence';

const METRICS: { key: MetricType; label: string; unit: string; color: string }[] = [
  { key: 'power', label: 'Power', unit: 'W', color: '#ff7300' },
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', color: '#ef4444' },
  { key: 'speed', label: 'Speed', unit: 'km/h', color: '#3b82f6' },
  { key: 'cadence', label: 'Cadence', unit: 'rpm', color: '#10b981' }
];

export default function TelemetryChart() {
  const { activities, appMode, activeSegmentId, segmentResults, currentTime, segmentRange, setCurrentTime, theme } = useAppStore();
  const [activeMetric, setActiveMetric] = useState<MetricType>('power');
  const [smoothing, setSmoothing] = useState<number>(0);
  const isDragging = useRef(false);

  const chartData = useMemo(() => {
    if (activities.length === 0) return [];
    
    let timeScale = 0;
    if (appMode === 'event') {
      const minTime = Math.min(...activities.map(a => a.startTime));
      const maxTime = Math.max(...activities.map(a => a.endTime));
      timeScale = maxTime - minTime;
    } else {
      if (!activeSegmentId && segmentResults.length === 0) return [];
      timeScale = segmentResults.length > 0 ? Math.max(...segmentResults.map(r => r.duration)) : 0;
    }

    if (timeScale <= 0) return [];

    const numBuckets = 200;
    const bucketSize = timeScale / numBuckets;
    const data = [];

    for (let i = 0; i <= numBuckets; i++) {
      const t = i * bucketSize;
      const point: any = { time: t };

      for (const act of activities) {
        if (appMode === 'event') {
          const minTime = Math.min(...activities.map(a => a.startTime));
          const absoluteTime = minTime + t;
          // Use binary search (or approx findIndex) to handle GPS pauses/gaps correctly!
          // Since it's sorted by time, we can find the closest point.
          let idx = -1;
          // Optimize finding the index since we are iterating t linearly
          // Actually, we can just use binary search, but for a 200-bucket chart findIndex is fine.
          // To make it fast, we can use binary search manually or just find the first point >= absoluteTime
          let low = 0, high = act.positions.length - 1;
          while (low <= high) {
            const mid = (low + high) >> 1;
            if (act.positions[mid].time < absoluteTime) {
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }
          idx = low < act.positions.length ? low : -1;

          if (idx !== -1 && Math.abs(act.positions[idx].time - absoluteTime) < 60) {
            let val = act.positions[idx][activeMetric];
            if (smoothing > 0 && typeof val === 'number') {
              let sum = 0;
              let count = 0;
              for (let j = idx; j >= Math.max(0, idx - smoothing); j--) {
                const v = act.positions[j][activeMetric];
                if (typeof v === 'number') {
                  sum += v;
                  count++;
                }
              }
              val = count > 0 ? sum / count : val;
            }
            if (activeMetric === 'speed' && val) val = val * 3.6;
            point[act.id] = val || null;
            if (act.id === activities[0].id) {
              point['elevation'] = act.positions[idx].elevation || null;
            }
          }
        } else {
          const result = segmentResults.find(r => r.activityId === act.id);
          if (result && t <= result.duration) {
            const absoluteTime = result.startTime + t;
            const idx = act.positions.findIndex(p => p.time >= absoluteTime);
            if (idx !== -1) {
              let val = act.positions[idx][activeMetric];
            if (smoothing > 0 && typeof val === 'number') {
              let sum = 0;
              let count = 0;
              for (let j = idx; j >= Math.max(0, idx - smoothing); j--) {
                const v = act.positions[j][activeMetric];
                if (typeof v === 'number') {
                  sum += v;
                  count++;
                }
              }
              val = count > 0 ? sum / count : val;
            }
            if (activeMetric === 'speed' && val) val = val * 3.6;
              point[act.id] = val || null;
            if (act.id === activities[0].id) {
              point['elevation'] = act.positions[idx].elevation || null;
            }
            }
          }
        }
      }
      data.push(point);
    }
    
    return data;
  }, [activities, appMode, activeSegmentId, segmentResults, activeMetric, smoothing]);

  // Find relative current time for the cursor
  let cursorTime = 0;
  if (appMode === 'event') {
    const minTime = Math.min(...activities.map(a => a.startTime));
    cursorTime = (currentTime || minTime) - minTime;
  } else {
    cursorTime = currentTime || 0;
  }

  const stats = useMemo(() => {
    const res: Record<string, { min: number; max: number; avg: number; current: number | null }> = {};
    for (const act of activities) {
      let min = Infinity, max = -Infinity, sum = 0, count = 0;
      let current: number | null = null;
      let closestDist = Infinity;
      
      for (const pt of chartData) {
        const val = pt[act.id];
        if (typeof val === 'number') {
          if (val < min) min = val;
          if (val > max) max = val;
          sum += val;
          count++;
        }
        
        const dist = Math.abs(pt.time - cursorTime);
        if (dist < closestDist) {
          closestDist = dist;
          current = typeof val === 'number' ? val : null;
        }
      }
      
      res[act.id] = {
        min: count > 0 ? min : 0,
        max: count > 0 ? max : 0,
        avg: count > 0 ? sum / count : 0,
        current
      };
    }
    return res;
  }, [activities, chartData, cursorTime]);

  if (activities.length === 0 || (appMode === 'segment' && !activeSegmentId)) {
    return null;
  }

  const activeUnit = METRICS.find(m => m.key === activeMetric)?.unit || '';
  const activeLabel = METRICS.find(m => m.key === activeMetric)?.label || '';

  return (
    <div className="h-64 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-2 flex flex-col relative z-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 px-2 md:px-4 gap-2">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider hidden sm:inline-block">Telemetry</span>
          <div className="flex gap-1">
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setActiveMetric(m.key)}
                className={`text-xs px-2 py-1 rounded transition-colors ${activeMetric === m.key ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {m.label}
              </button>
            ))}
            {/* Smoothing Selector */}
            <div className="border-l border-gray-200 dark:border-gray-700 pl-2 ml-1 flex gap-1">
              {[0, 5, 10, 30].map(s => (
                <button
                  key={s}
                  onClick={() => setSmoothing(s)}
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${smoothing === s ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  {s === 0 ? 'Raw' : `${s}s`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Legend / Stats */}
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-1 max-w-full hide-scrollbar">
          {activities.map(act => {
            const s = stats[act.id];
            return (
              <div key={act.id} className="flex flex-col text-xs" style={{ color: act.color }}>
                <div className="font-bold mb-1 border-b border-gray-200 dark:border-gray-700 pb-0.5">{act.name}</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-gray-500 dark:text-gray-400">
                  <span>LIVE: <span className="text-gray-900 dark:text-white font-mono">{s.current !== null ? Math.round(s.current) : '-'}</span> {activeUnit}</span>
                  <span>AVG: <span className="text-gray-700 dark:text-gray-200 font-mono">{Math.round(s.avg)}</span> {activeUnit}</span>
                  <span>MIN: <span className="text-gray-700 dark:text-gray-200 font-mono">{Math.round(s.min)}</span> {activeUnit}</span>
                  <span>MAX: <span className="text-gray-700 dark:text-gray-200 font-mono">{Math.round(s.max)}</span> {activeUnit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex-1 min-h-0 relative">
        
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

            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#374151" : "#E5E7EB"} vertical={false} />
            <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} hide />
            <YAxis stroke={theme === 'dark' ? "#9CA3AF" : "#6B7280"} fontSize={10} tickFormatter={(val) => Math.round(val).toString()} width={40} />
            
            <YAxis yAxisId="ele" orientation="right" hide domain={['dataMin', 'dataMax + 200']} />
            <Area 
              yAxisId="ele" 
              type="monotone" 
              dataKey="elevation" 
              fill={theme === 'dark' ? "#374151" : "#E5E7EB"} 
              stroke="none" 
              fillOpacity={0.3} 
              isAnimationActive={false} 
            />
<Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              labelFormatter={(label) => `Time: ${Math.round(Number(label))}s`}
            />
            {activities.map(act => (
              <Line 
                key={act.id} 
                type="monotone" 
                dataKey={act.id} 
                name={act.name} 
                stroke={act.color} 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={false}
              />
            ))}
            <ReferenceLine x={cursorTime} stroke="#A855F7" strokeDasharray="3 3" />
          
        
          </ComposedChart>
</ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
