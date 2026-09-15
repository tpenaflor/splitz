import { create } from 'zustand';
import { DetectedSegment, ActivitySegmentResult, detectCommonSegments, computeSegmentResults, computeEventBounds, computePrivacyBounds } from '../lib/segmentDetection';

export type Position = {
  time: number; // Unix timestamp in seconds
  lat: number;
  lon: number;
  elevation?: number;
  heartRate?: number;
  power?: number;
  cadence?: number;
  speed?: number;
};

export type ActivityData = {
  id: string;
  name: string;
  color: string;
  positions: Position[];
  startTime: number;
  endTime: number;
  totalDistance?: number;
};

interface AppState {
  activities: ActivityData[];
  currentTime: number | null;
  minTime: number | null;
  maxTime: number | null;
  eventPrivacyMinTime: number | null;
  eventPrivacyMaxTime: number | null;
  isPlaying: boolean;
  playbackSpeed: number; // multiplier, e.g., 10x real time
  
  appMode: 'event' | 'segment';
  theme: 'light' | 'dark';
  isSettingsOpen: boolean;
  privacyMode: boolean;
  detectedSegments: DetectedSegment[];
  activeSegmentId: string | null;
  segmentResults: ActivitySegmentResult[];
  baseSegmentResults: ActivitySegmentResult[];
  segmentRange: [number, number] | null; // start and end index of reference activity

  addActivity: (activity: ActivityData) => void;
  removeActivity: (id: string) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setAppMode: (mode: 'event' | 'segment') => void;
  setActiveSegment: (id: string | null) => void;
  setSegmentRange: (range: [number, number]) => void;
  extractSegment: () => void;
  deleteSegment: (id: string) => void;
  setPrivacyMode: (val: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
}




export const useAppStore = create<AppState>((set, get) => ({
  activities: [],
  currentTime: null,
  minTime: null,
  maxTime: null,
  eventPrivacyMinTime: null,
  eventPrivacyMaxTime: null,
  isPlaying: false,
  playbackSpeed: 10,
  
  appMode: 'event',
  theme: 'dark',
  isSettingsOpen: false,
  privacyMode: true,
  detectedSegments: [],
  activeSegmentId: null,
  segmentResults: [],
  baseSegmentResults: [],
  segmentRange: null,

  addActivity: (activity) => set((state) => {
    if (state.activities.some(a => a.id === activity.id)) return state;

    const colors = ['#9333ea', '#db2777', '#0284c7', '#16a34a', '#ea580c', '#eab308'];
    const usedColors = state.activities.map(a => a.color);
    const availableColors = colors.filter(c => !usedColors.includes(c));
    const assignedColor = availableColors.length > 0 ? availableColors[0] : colors[state.activities.length % colors.length];
    
    const newActivity = { ...activity, color: assignedColor };
    const newActivities = [...state.activities, newActivity];
    const newDetectedSegments = detectCommonSegments(newActivities);
    
    if (state.appMode === 'segment' && !state.activeSegmentId) {
      const results = newActivities.map(a => ({
        activityId: a.id,
        startTime: a.startTime,
        endTime: a.endTime,
        duration: a.endTime - a.startTime
      }));
      const maxDuration = results.length > 0 ? Math.max(...results.map(r => r.duration)) : 0;
      
      return {
        activities: newActivities,
        minTime: 0,
        maxTime: maxDuration,
        currentTime: 0,
        detectedSegments: newDetectedSegments,
        segmentResults: results,
        baseSegmentResults: results,
        segmentRange: newActivities.length > 0 ? [0, newActivities[0].positions.length - 1] : null
      };
    }

    const { minTime, maxTime } = computeEventBounds(newActivities);
    const privacyBounds = computePrivacyBounds(newActivities, state.privacyMode);
    return {
      activities: newActivities,
      minTime,
      maxTime,
      eventPrivacyMinTime: privacyBounds.minTime,
      eventPrivacyMaxTime: privacyBounds.maxTime,
      currentTime: (state.currentTime === null || (minTime !== null && state.currentTime < minTime)) ? minTime : state.currentTime,
      detectedSegments: newDetectedSegments
    };
  }),

  removeActivity: (id) => set((state) => {
    const newActivities = state.activities.filter(a => a.id !== id);
    if (newActivities.length === 0) {
      return { activities: [], minTime: null, maxTime: null, eventPrivacyMinTime: null, eventPrivacyMaxTime: null, currentTime: null, isPlaying: false, detectedSegments: [], activeSegmentId: null, segmentResults: [], baseSegmentResults: [] };
    }
    const newDetectedSegments = detectCommonSegments(newActivities);
    
    if (state.appMode === 'segment' && !state.activeSegmentId) {
      const results = newActivities.map(a => ({
        activityId: a.id,
        startTime: a.startTime,
        endTime: a.endTime,
        duration: a.endTime - a.startTime
      }));
      const maxDuration = Math.max(...results.map(r => r.duration));
      return {
        activities: newActivities,
        minTime: 0,
        maxTime: maxDuration,
        currentTime: 0,
        detectedSegments: newDetectedSegments,
        segmentResults: results,
        baseSegmentResults: results,
        segmentRange: newActivities.length > 0 ? [0, newActivities[0].positions.length - 1] : null
      };
    }

    const { minTime, maxTime } = computeEventBounds(newActivities);
    const privacyBounds = computePrivacyBounds(newActivities, state.privacyMode);
    return {
      activities: newActivities,
      minTime,
      maxTime,
      eventPrivacyMinTime: privacyBounds.minTime,
      eventPrivacyMaxTime: privacyBounds.maxTime,
      currentTime: (state.currentTime !== null && maxTime !== null && state.currentTime > maxTime) ? maxTime : state.currentTime,
      detectedSegments: newDetectedSegments,
      activeSegmentId: null,
      segmentResults: [],
      segmentRange: null
    };
  }),

  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setAppMode: (mode) => set((state) => {
    if (mode === 'event') {
      const { minTime, maxTime } = computeEventBounds(state.activities);
      const privacyBounds = computePrivacyBounds(state.activities, state.privacyMode);
      return { appMode: mode, minTime, maxTime, eventPrivacyMinTime: privacyBounds.minTime, eventPrivacyMaxTime: privacyBounds.maxTime, currentTime: minTime, activeSegmentId: null, segmentResults: [], baseSegmentResults: [], segmentRange: null };
    } else if (mode === 'segment') {
      const results = state.activities.map(a => ({
        activityId: a.id,
        startTime: a.startTime,
        endTime: a.endTime,
        duration: a.endTime - a.startTime
      }));
      const maxDuration = results.length > 0 ? Math.max(...results.map(r => r.duration)) : 0;
      return { 
        appMode: mode, 
        minTime: 0, 
        maxTime: maxDuration, 
        currentTime: 0, 
        activeSegmentId: null,
        segmentResults: results,
        baseSegmentResults: results,
        segmentRange: state.activities.length > 0 ? [0, state.activities[0].positions.length - 1] : null
      };
    }
    return { appMode: mode };
  }),

  setActiveSegment: (id) => set((state) => {
    if (!id) {
      if (state.appMode === 'segment') {
        const results = state.activities.map(a => ({
          activityId: a.id,
          startTime: a.startTime,
          endTime: a.endTime,
          duration: a.endTime - a.startTime
        }));
        const maxDuration = results.length > 0 ? Math.max(...results.map(r => r.duration)) : 0;
        return { 
          activeSegmentId: null, 
          segmentResults: results, 
          baseSegmentResults: results, 
          segmentRange: state.activities.length > 0 ? [0, state.activities[0].positions.length - 1] : null, 
          minTime: 0, 
          maxTime: maxDuration, 
          currentTime: 0, 
          isPlaying: false 
        };
      } else {
        const { minTime, maxTime } = computeEventBounds(state.activities);
        const privacyBounds = computePrivacyBounds(state.activities, state.privacyMode);
        return { 
          activeSegmentId: null, 
          segmentResults: [], 
          baseSegmentResults: [], 
          segmentRange: null, 
          minTime, 
          maxTime, 
          eventPrivacyMinTime: privacyBounds.minTime,
          eventPrivacyMaxTime: privacyBounds.maxTime,
          currentTime: minTime, 
          isPlaying: false 
        };
      }
    }
    const seg = state.detectedSegments.find(s => s.id === id);
    if (!seg) return {};

    const range: [number, number] = [seg.startIndex, seg.endIndex];
    
    const ref = state.activities[0];
    const results = computeSegmentResults(
      state.activities, 
      ref.positions[range[0]], 
      ref.positions[range[1]], 
      seg.lengthMeters
    );
    
    const maxDuration = Math.max(...results.map(r => r.duration));

    return {
      appMode: 'segment',
      activeSegmentId: id,
      segmentRange: range,
      segmentResults: results,
      baseSegmentResults: results,
      minTime: 0,
      maxTime: maxDuration,
      currentTime: 0,
      isPlaying: false
    };
  }),

  setSegmentRange: (range) => set((state) => {
    if (!state.activeSegmentId) return {};
    const seg = state.detectedSegments.find(s => s.id === state.activeSegmentId);
    if (!seg) return {};

    // Approximate trimmed length (not exact but close enough for the speed check)
    const proportion = (range[1] - range[0]) / (seg.endIndex - seg.startIndex);
    const trimmedLengthMeters = seg.lengthMeters * proportion;

    const ref = state.activities[0];
    const constraints: Record<string, { minTime: number, maxTime: number }> = {};
    if (state.baseSegmentResults) {
      state.baseSegmentResults.forEach(r => {
        constraints[r.activityId] = { minTime: r.startTime - 120, maxTime: r.endTime + 120 };
      });
    }

    const results = computeSegmentResults(
      state.activities, 
      ref.positions[range[0]], 
      ref.positions[range[1]], 
      trimmedLengthMeters,
      constraints
    );
    
    const maxDuration = Math.max(...results.map(r => r.duration));

    return {
      segmentRange: range,
      segmentResults: results,
      minTime: 0,
      maxTime: maxDuration,
      currentTime: 0,
    };
  }),

  extractSegment: () => set((state) => {
    if (!state.activeSegmentId || !state.segmentRange) return {};
    const baseSeg = state.detectedSegments.find(s => s.id === state.activeSegmentId);
    if (!baseSeg) return {};

    const proportion = (state.segmentRange[1] - state.segmentRange[0]) / (baseSeg.endIndex - baseSeg.startIndex);
    const newId = Math.random().toString(36).substr(2, 9);
    const customCount = state.detectedSegments.filter(s => s.isCustom).length + 1;
    const newSeg: DetectedSegment = {
      id: newId,
      startIndex: state.segmentRange[0],
      endIndex: state.segmentRange[1],
      lengthMeters: baseSeg.lengthMeters * proportion,
      name: `Custom Segment ${customCount}`,
      isCustom: true
    };

    return {
      detectedSegments: [...state.detectedSegments, newSeg],
      activeSegmentId: newId
    };
  }),
  setPrivacyMode: (val) => set((state) => {
    const updates: Partial<AppState> = { privacyMode: val };
    if (state.appMode === 'event') {
      const privacyBounds = computePrivacyBounds(state.activities, val);
      updates.eventPrivacyMinTime = privacyBounds.minTime;
      updates.eventPrivacyMaxTime = privacyBounds.maxTime;
    }
    return updates;
  }),
  setTheme: (theme) => set({ theme }),
  setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  deleteSegment: (id) => set((state) => ({
    detectedSegments: state.detectedSegments.filter(s => s.id !== id),
    activeSegmentId: state.activeSegmentId === id ? null : state.activeSegmentId
  }))
}));

