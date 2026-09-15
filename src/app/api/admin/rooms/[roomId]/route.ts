import { NextResponse } from 'next/server';
import { firestore, storage } from '@/lib/db';

const BUCKET_NAME = process.env.FIT_FILES_BUCKET || 'splitz-multiplayer-files-508621';

export async function DELETE(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  
  try {
    const roomRef = firestore.collection('rooms').doc(roomId);
    const participantsSnapshot = await roomRef.collection('participants').get();

    // 1. Delete all GCS files and Participant documents
    const bucket = storage.bucket(BUCKET_NAME);
    
    await Promise.all(participantsSnapshot.docs.map(async (doc) => {
      const participantId = doc.id;
      const fileName = `rooms/${roomId}/${participantId}.json`;
      
      try {
        await bucket.file(fileName).delete();
      } catch (e) {
        console.error(`Failed to delete GCS file ${fileName}:`, e);
      }
      
      await doc.ref.delete();
    }));

    // 2. Delete the room document
    await roomRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
