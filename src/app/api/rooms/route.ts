import { NextResponse } from 'next/server';
import { firestore } from '@/lib/db';

export async function POST() {
  try {
    const roomRef = firestore.collection('rooms').doc();
    await roomRef.set({
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ roomId: roomRef.id });
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
