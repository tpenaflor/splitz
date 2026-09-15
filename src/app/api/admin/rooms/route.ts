import { NextResponse } from 'next/server';
import { firestore } from '@/lib/db';

export async function GET() {
  try {
    const roomsSnapshot = await firestore.collection('rooms').orderBy('createdAt', 'desc').get();
    
    const rooms = await Promise.all(roomsSnapshot.docs.map(async (doc) => {
      const roomData = doc.data();
      
      const participantsSnapshot = await doc.ref.collection('participants').get();
      const participants = participantsSnapshot.docs.map(pDoc => ({
        id: pDoc.id,
        ...pDoc.data()
      }));

      return {
        id: doc.id,
        createdAt: roomData.createdAt,
        participants
      };
    }));

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Failed to fetch admin rooms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
