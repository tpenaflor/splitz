import { describe, test, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore Segment Mode', () => {
  beforeEach(() => {
    // Reset state before each test
    useAppStore.setState({
      activities: [],
      currentTime: null,
      minTime: null,
      maxTime: null,
      isPlaying: false,
      appMode: 'event',
      detectedSegments: [],
      activeSegmentId: null,
      segmentResults: [],
      baseSegmentResults: [],
      segmentRange: null,
    });
  });

  const mockActivity1 = {
    id: '1',
    name: 'Activity 1',
    startTime: 1000,
    endTime: 2000,
    positions: [{ lat: 10, lon: 10, time: 1000 }, { lat: 20, lon: 20, time: 2000 }],
    distance: 1000,
    movingTime: 1000,
    elevationGain: 10,
    type: 'Ride',
    color: '#000'
  };

  const mockActivity2 = {
    id: '2',
    name: 'Activity 2',
    startTime: 3000,
    endTime: 4500,
    positions: [{ lat: 10, lon: 10, time: 3000 }, { lat: 20, lon: 20, time: 4500 }],
    distance: 1500,
    movingTime: 1500,
    elevationGain: 20,
    type: 'Ride',
    color: '#111'
  };

  test('setAppMode to segment treats full activity as segment if no activeSegmentId', () => {
    const store = useAppStore.getState();
    store.addActivity(mockActivity1 as any);
    store.addActivity(mockActivity2 as any);
    
    useAppStore.getState().setAppMode('segment');
    const state = useAppStore.getState();

    expect(state.appMode).toBe('segment');
    expect(state.minTime).toBe(0);
    // Max duration is 1500 (from Activity 2)
    expect(state.maxTime).toBe(1500);
    expect(state.segmentResults.length).toBe(2);
    expect(state.segmentResults[0].duration).toBe(1000);
    expect(state.segmentResults[1].duration).toBe(1500);
    expect(state.segmentRange).toEqual([0, 1]); // length of positions - 1
  });

  test('addActivity recalculates full segment bounds in segment mode', () => {
    const store = useAppStore.getState();
    store.setAppMode('segment');
    
    // Add first activity
    store.addActivity(mockActivity1 as any);
    let state = useAppStore.getState();
    
    expect(state.minTime).toBe(0);
    expect(state.maxTime).toBe(1000);
    expect(state.segmentResults.length).toBe(1);

    // Add second activity which has a longer duration
    store.addActivity(mockActivity2 as any);
    state = useAppStore.getState();
    
    expect(state.minTime).toBe(0);
    expect(state.maxTime).toBe(1500); // Updated to new max duration
    expect(state.segmentResults.length).toBe(2);
  });

  test('removeActivity recalculates full segment bounds in segment mode', () => {
    const store = useAppStore.getState();
    store.addActivity(mockActivity1 as any);
    store.addActivity(mockActivity2 as any);
    store.setAppMode('segment');
    
    let state = useAppStore.getState();
    expect(state.maxTime).toBe(1500);

    store.removeActivity('2');
    state = useAppStore.getState();

    // After removing the 1500 duration activity, max should be 1000
    expect(state.maxTime).toBe(1000);
    expect(state.segmentResults.length).toBe(1);
    expect(state.segmentResults[0].activityId).toBe('1');
  });

  test('setActiveSegment(null) in segment mode reverts to full-activity segment', () => {
    const store = useAppStore.getState();
    store.addActivity(mockActivity1 as any);
    store.setAppMode('segment');
    
    // Simulate setting an active segment
    useAppStore.setState({ activeSegmentId: 'abc', maxTime: 50 });
    
    // Clear active segment
    store.setActiveSegment(null);
    const state = useAppStore.getState();
    
    expect(state.activeSegmentId).toBeNull();
    expect(state.minTime).toBe(0);
    expect(state.maxTime).toBe(1000);
    expect(state.segmentResults.length).toBe(1);
  });
});
