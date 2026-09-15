import { NextResponse } from 'next/server';
import { firestore, storage } from '@/lib/db';

// Fallback to the known bucket name if env var is missing during local dev
const BUCKET_NAME = process.env.FIT_FILES_BUCKET || 'splitz-multiplayer-files-508621';

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
  // In Next.js 14/15 App Router, `params` should be awaited or accessed carefully depending on version.
  // Next.js 15 requires awaiting params, but we're on 14. Let's just use it directly.
  const { roomId } = params;
  
  try {
    const body = await request.json();
    const { activityData } = body;

    if (!activityData || !activityData.id) {
      return NextResponse.json({ error: 'Missing activityData' }, { status: 400 });
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

export async function GET(request: Request, { params }: { params: { roomId: string } }) {
  const { roomId } = params;
  
  try {
    const snapshot = await firestore.collection('rooms').doc(roomId).collection('participants').get();
    
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
