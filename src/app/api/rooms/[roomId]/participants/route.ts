import { NextResponse } from 'next/server';
import { firestore, storage } from '@/lib/db';

function computeBounds(positions: any[]) {
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const p of positions) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lon < minLon) minLon = p.lon;
    if (p.lon > maxLon) maxLon = p.lon;
  }
  return { minLat, maxLat, minLon, maxLon };
}


// Fallback to the known bucket name if env var is missing during local dev
const BUCKET_NAME = process.env.FIT_FILES_BUCKET || 'splitz-multiplayer-files-508621';

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  
  try {
    const roomRef = firestore.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    
    if (!roomDoc.exists) {
      return NextResponse.json({ error: 'Activity Group not found' }, { status: 404 });
    }

    const body = await request.json();
    const { activityData } = body;

    if (!activityData || !activityData.id) {
      return NextResponse.json({ error: 'Missing activityData' }, { status: 400 });
    }

    const positions = activityData.positions || [];
    if (positions.length === 0) {
      return NextResponse.json({ error: 'Activity has no GPS data' }, { status: 400 });
    }

    const { minLat, maxLat, minLon, maxLon } = computeBounds(positions);
    const bounds = { minLat, maxLat, minLon, maxLon, startTime: activityData.startTime, endTime: activityData.endTime };
    const roomData = roomDoc.data();

    if (!roomData?.baseActivityData) {
      await roomRef.update({ baseActivityData: bounds, baseActivityId: activityData.id });
    } else {
      const base = roomData.baseActivityData;
      const BUFFER = 0.005; // ~500m

      const intersects = (
        minLat <= base.maxLat + BUFFER &&
        maxLat >= base.minLat - BUFFER &&
        minLon <= base.maxLon + BUFFER &&
        maxLon >= base.minLon - BUFFER
      );

      if (!intersects) {
        return NextResponse.json({ error: "Activity does not overlap spatially with the group's route." }, { status: 400 });
      }

      if (roomData.mode === 'event') {
        const timeIntersects = Math.max(activityData.startTime, base.startTime) <= Math.min(activityData.endTime, base.endTime);
        if (!timeIntersects) {
          return NextResponse.json({ error: "Activity must overlap in time for Event mode." }, { status: 400 });
        }
      }
    }

    const participantId = activityData.id;
    const fileName = `rooms/${roomId}/${participantId}.json`;
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(fileName);

    // Save large telemetry JSON to GCS
    await file.save(JSON.stringify(activityData), {
      contentType: 'application/json',
    });

    // Create a lightweight reference in Firestore
    const participantRef = firestore.collection('rooms').doc(roomId).collection('participants').doc(participantId);
    await participantRef.set({
      id: activityData.id,
      name: activityData.name,
      color: activityData.color,
      startTime: activityData.startTime,
      endTime: activityData.endTime,
      dataUrl: `/api/rooms/${roomId}/data?participantId=${participantId}`,
      addedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to add participant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  
  try {
    const roomRef = firestore.collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();
    
    if (!roomDoc.exists) {
      return NextResponse.json({ error: 'Activity Group not found' }, { status: 404 });
    }

    const snapshot = await roomRef.collection('participants').get();
    
    if (snapshot.empty) {
      return NextResponse.json({ participants: [] });
    }

    const participants = snapshot.docs.map(doc => doc.data());
    return NextResponse.json({ participants });
  } catch (error) {
    console.error('Failed to list participants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
