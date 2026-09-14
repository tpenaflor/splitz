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
      const bounds = computeEventBounds([], [], true);
      expect(bounds).toEqual({ minTime: null, maxTime: null });
    });

    it('returns absolute min/max when privacyMode is false', () => {
      const activities: any = [
        { startTime: 100, endTime: 200, positions: [] },
        { startTime: 150, endTime: 250, positions: [] }
      ];
      const bounds = computeEventBounds(activities, [], false);
      expect(bounds).toEqual({ minTime: 100, maxTime: 250 });
    });

    it('finds correctly proximity-based meetup bounds', () => {
      // Mock two activities that start far apart, meet in the middle, and separate
      const act1: any = {
        startTime: 100,
        endTime: 110,
        positions: [
          { time: 100, lat: 0, lon: 0 },
          { time: 101, lat: 0, lon: 0 },
          { time: 102, lat: 0.1, lon: 0 }, // Far
          { time: 103, lat: 0.2, lon: 0 }, // Meetup starts (they are at the same spot)
          { time: 104, lat: 0.2, lon: 0 },
          { time: 105, lat: 0.2, lon: 0 }, // Meetup ends
          { time: 106, lat: 0.4, lon: 0 }, // Separated
          { time: 107, lat: 0.5, lon: 0 },
        ]
      };
      
      const act2: any = {
        startTime: 100,
        endTime: 110,
        positions: [
          { time: 100, lat: 1, lon: 0 },
          { time: 101, lat: 1, lon: 0 },
          { time: 102, lat: 1.1, lon: 0 },
          { time: 103, lat: 0.2, lon: 0 }, // Meetup starts
          { time: 104, lat: 0.2, lon: 0 },
          { time: 105, lat: 0.2, lon: 0 }, // Meetup ends
          { time: 106, lat: 1.4, lon: 0 },
          { time: 107, lat: 1.5, lon: 0 },
        ]
      };

      const activities = [act1, act2];
      const bounds = computeEventBounds(activities, [], true);

      // The meetup should be strictly from t=103 to t=105.
      // Privacy buffer is 180s.
      // So minTime should be 103 - 180 = -77
      // maxTime should be 105 + 180 = 285
      expect(bounds).toEqual({ minTime: 103 - 180, maxTime: 105 + 180 });
    });

    it('falls back to absolute min/max if they never meet', () => {
      const act1: any = {
        startTime: 100,
        endTime: 110,
        positions: [
          { time: 100, lat: 0, lon: 0 },
          { time: 101, lat: 0, lon: 0 }
        ]
      };
      const act2: any = {
        startTime: 100,
        endTime: 110,
        positions: [
          { time: 100, lat: 1, lon: 0 },
          { time: 101, lat: 1, lon: 0 }
        ]
      };

      const activities = [act1, act2];
      const bounds = computeEventBounds(activities, [], true);
      
      expect(bounds).toEqual({ minTime: 100, maxTime: 110 });
    });
  });
});
