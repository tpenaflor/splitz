import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Position } from "../store/useAppStore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function interpolatePosition(positions: Position[], time: number): Position | null {
  if (!positions || positions.length === 0) return null;
  
  if (time <= positions[0].time) return positions[0];
  if (time >= positions[positions.length - 1].time) return positions[positions.length - 1];

  let low = 0;
  let high = positions.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const p = positions[mid];

    if (p.time === time) return p;

    if (p.time < time) {
      if (mid + 1 < positions.length && positions[mid + 1].time > time) {
        // Found the interval
        const p1 = p;
        const p2 = positions[mid + 1];
        const ratio = (time - p1.time) / (p2.time - p1.time);
        return {
          time,
          lat: p1.lat + (p2.lat - p1.lat) * ratio,
          lon: p1.lon + (p2.lon - p1.lon) * ratio,
          elevation: (p1.elevation && p2.elevation) 
            ? p1.elevation + (p2.elevation - p1.elevation) * ratio 
            : undefined,
        };
      }
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return null;
}
