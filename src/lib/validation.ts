export function computeBounds(positions: any[]) {
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const p of positions) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lon < minLon) minLon = p.lon;
    if (p.lon > maxLon) maxLon = p.lon;
  }
  return { minLat, maxLat, minLon, maxLon };
}

export function validateActivity(
  incomingBounds: { minLat: number, maxLat: number, minLon: number, maxLon: number, startTime: number, endTime: number },
  baseBounds: { minLat: number, maxLat: number, minLon: number, maxLon: number, startTime: number, endTime: number },
  mode: 'event' | 'segment',
  bufferDegrees: number = 0.005
): { valid: boolean, error?: string } {
  const intersects = (
    incomingBounds.minLat <= baseBounds.maxLat + bufferDegrees &&
    incomingBounds.maxLat >= baseBounds.minLat - bufferDegrees &&
    incomingBounds.minLon <= baseBounds.maxLon + bufferDegrees &&
    incomingBounds.maxLon >= baseBounds.minLon - bufferDegrees
  );

  if (!intersects) {
    return { valid: false, error: "Activity does not overlap spatially with the group's route." };
  }

  if (mode === 'event') {
    const timeIntersects = Math.max(incomingBounds.startTime, baseBounds.startTime) <= Math.min(incomingBounds.endTime, baseBounds.endTime);
    if (!timeIntersects) {
      return { valid: false, error: "Activity must overlap in time for Event mode." };
    }
  }

  return { valid: true };
}
