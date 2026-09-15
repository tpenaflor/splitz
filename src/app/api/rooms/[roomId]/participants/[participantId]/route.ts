import { NextResponse } from 'next/server';
import { firestore, storage } from '@/lib/db';

const BUCKET_NAME = process.env.FIT_FILES_BUCKET || 'splitz-multiplayer-files-508621';

export async function DELETE(request: Request, { params }: { params: Promise<{ roomId: string, participantId: string }> }) {
  const { roomId, participantId } = await params;
  
  try {
    // Delete from Firestore
    await firestore.collection('rooms').doc(roomId).collection('participants').doc(participantId).delete();

    // Delete from GCS
    try {
      const fileName = `rooms/${roomId}/${participantId}.json`;
      const bucket = storage.bucket(BUCKET_NAME);
      await bucket.file(fileName).delete();
    } catch (e) {
      console.error("GCS delete failed, but ignoring:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete participant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
