import GpxParser from 'gpxparser';
import FitParser from 'fit-file-parser';
import { Position, ActivityData } from '../store/useAppStore';

function generateColor() {
  const colors = ['#9333ea', '#db2777', '#0284c7', '#16a34a', '#ea580c', '#eab308'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export async function parseGPX(file: File, id: string): Promise<ActivityData | null> {
  const text = await file.text();
  const gpx = new GpxParser();
  gpx.parse(text);

  if (!gpx.tracks || gpx.tracks.length === 0) return null;

  const track = gpx.tracks[0];
  const positions: Position[] = [];

  for (const point of track.points) {
    if (point.time) {
      positions.push({
        time: point.time.getTime() / 1000,
        lat: point.lat,
        lon: point.lon,
        elevation: point.ele
      });
    }
  }

  if (positions.length === 0) return null;

  return {
    id,
    name: file.name.replace('.gpx', ''),
    color: generateColor(),
    positions,
    startTime: positions[0].time,
    endTime: positions[positions.length - 1].time
  };
}

export async function parseFIT(file: File, id: string): Promise<ActivityData | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const buffer = await file.arrayBuffer();
      const fitParser = new FitParser({
        force: true,
        speedUnit: 'm/s',
        lengthUnit: 'm',
        temperatureUnit: 'celsius',
        elapsedRecordField: true,
        mode: 'both',
      });

      fitParser.parse(buffer, (error: any, data: any) => {
        if (error) {
          console.error("FIT parsing error:", error);
          resolve(null);
          return;
        }

        const positions: Position[] = [];
        if (data && data.records && data.records.length > 0) {
          for (const record of data.records) {
            // FIT parser returns semicircles sometimes, but usually it returns degrees if available.
            // If it returns semicircles, we might need to convert. Let's assume it provides position_lat / position_long in degrees.
            if (record.position_lat !== undefined && record.position_long !== undefined && record.timestamp) {
              positions.push({
                time: new Date(record.timestamp).getTime() / 1000,
                lat: record.position_lat,
                lon: record.position_long,
                elevation: record.enhanced_altitude ?? record.altitude,
                heartRate: record.heart_rate,
                power: record.power,
                cadence: record.cadence,
                speed: record.enhanced_speed ?? record.speed
              });
            }
          }
        }

        if (positions.length === 0) {
          resolve(null);
          return;
        }

        resolve({
          id,
          name: file.name.replace('.fit', '').replace('.FIT', ''),
          color: generateColor(),
          positions,
          startTime: positions[0].time,
          endTime: positions[positions.length - 1].time
        });
      });
    } catch (err) {
      console.error(err);
      resolve(null);
    }
  });
}
