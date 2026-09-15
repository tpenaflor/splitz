import { NextResponse } from 'next/server';
import { firestore, storage } from '@/lib/db';
import { computeBounds, validateActivity } from '@/lib/validation';



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
      const validation = validateActivity(bounds, base, roomData.mode || 'event', 0.005);
      
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
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
