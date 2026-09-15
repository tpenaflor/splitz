import { NextResponse } from 'next/server';
import { storage } from '@/lib/db';

const BUCKET_NAME = process.env.FIT_FILES_BUCKET || 'splitz-multiplayer-files-508621';

export async function GET(request: Request, { params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const url = new URL(request.url);
  const participantId = url.searchParams.get('participantId');

  if (!participantId) {
    return NextResponse.json({ error: 'Missing participantId' }, { status: 400 });
  }

  try {
    const fileName = `rooms/${roomId}/${participantId}.json`;
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(fileName);

    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json({ error: 'Data not found' }, { status: 404 });
    }

    const [content] = await file.download();
    const data = JSON.parse(content.toString('utf-8'));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch participant data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
