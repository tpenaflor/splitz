import { describe, it, expect } from 'vitest';
import { getDistance, computeEventBounds, ActivitySegmentResult, DetectedSegment } from './segmentDetection';

describe('segmentDetection', () => {
  describe('getDistance', () => {
    it('calculates roughly 111km for 1 degree of latitude', () => {
      const p1 = { lat: 0, lon: 0 };
      const p2 = { lat: 1, lon: 0 };
      const dist = getDistance(p1, p2);
      expect(dist).toBeGreaterThan(111000);
      expect(dist).toBeLessThan(112000);
    });
  });

  describe('computeEventBounds', () => {
    it('returns null bounds when no activities are provided', () => {
      const bounds = computeEventBounds([]);
      expect(bounds).toEqual({ minTime: null, maxTime: null });
    });

    it('returns absolute min/max', () => {
      const activities: any = [
        { startTime: 100, endTime: 200, positions: [] },
        { startTime: 150, endTime: 250, positions: [] }
      ];
      const bounds = computeEventBounds(activities);
      expect(bounds).toEqual({ minTime: 100, maxTime: 250 });
    });
  });
});
