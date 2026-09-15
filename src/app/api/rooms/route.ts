import { NextResponse } from 'next/server';
import { firestore } from '@/lib/db';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

export async function POST() {
  try {
    // Generate a readable room ID like: "fast-blue-cheetah"
    const readableId = uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals],
      separator: '-',
      length: 3,
    });

    const roomRef = firestore.collection('rooms').doc(readableId);
    await roomRef.set({
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ roomId: readableId });
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
