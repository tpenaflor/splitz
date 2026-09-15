import { describe, it, expect } from 'vitest';
import { computeBounds, validateActivity } from './validation';

describe('computeBounds', () => {
  it('correctly computes bounds for an array of positions', () => {
    const positions = [
      { lat: 10, lon: 20 },
      { lat: 15, lon: 15 },
      { lat: 5, lon: 25 },
    ];
    const bounds = computeBounds(positions);
    expect(bounds).toEqual({
      minLat: 5,
      maxLat: 15,
      minLon: 15,
      maxLon: 25,
    });
  });

  it('handles empty positions array', () => {
    const bounds = computeBounds([]);
    expect(bounds).toEqual({
      minLat: Infinity,
      maxLat: -Infinity,
      minLon: Infinity,
      maxLon: -Infinity,
    });
  });
});

describe('validateActivity', () => {
  const baseBounds = {
    minLat: 10, maxLat: 20,
    minLon: 10, maxLon: 20,
    startTime: 1000, endTime: 2000,
  };

  it('allows spatially and temporally overlapping activity in event mode', () => {
    const incomingBounds = {
      minLat: 15, maxLat: 25,
      minLon: 15, maxLon: 25,
      startTime: 1500, endTime: 2500,
    };
    const result = validateActivity(incomingBounds, baseBounds, 'event', 0.005);
    expect(result.valid).toBe(true);
  });

  it('rejects spatially disparate activity in segment mode', () => {
    const incomingBounds = {
      minLat: 30, maxLat: 40,
      minLon: 30, maxLon: 40,
      startTime: 1500, endTime: 2500,
    };
    const result = validateActivity(incomingBounds, baseBounds, 'segment', 0.005);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('overlap spatially');
  });

  it('allows spatially overlapping but temporally disparate activity in segment mode', () => {
    const incomingBounds = {
      minLat: 15, maxLat: 25,
      minLon: 15, maxLon: 25,
      startTime: 3000, endTime: 4000, // Non-overlapping time
    };
    const result = validateActivity(incomingBounds, baseBounds, 'segment', 0.005);
    expect(result.valid).toBe(true);
  });

  it('rejects spatially overlapping but temporally disparate activity in event mode', () => {
    const incomingBounds = {
      minLat: 15, maxLat: 25,
      minLon: 15, maxLon: 25,
      startTime: 3000, endTime: 4000, // Non-overlapping time
    };
    const result = validateActivity(incomingBounds, baseBounds, 'event', 0.005);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('overlap in time');
  });

  it('respects the buffer distance', () => {
    const incomingBounds = {
      minLat: 20.004, maxLat: 25,
      minLon: 20.004, maxLon: 25,
      startTime: 1500, endTime: 2500,
    };
    // Distance from base maxLat (20) to incoming minLat (20.004) is 0.004 < 0.005
    const result = validateActivity(incomingBounds, baseBounds, 'segment', 0.005);
    expect(result.valid).toBe(true);
    
    const tooFarBounds = {
      minLat: 20.006, maxLat: 25,
      minLon: 20.006, maxLon: 25,
      startTime: 1500, endTime: 2500,
    };
    // Distance 0.006 > 0.005
    const resultTooFar = validateActivity(tooFarBounds, baseBounds, 'segment', 0.005);
    expect(resultTooFar.valid).toBe(false);
  });
});
