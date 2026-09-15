import { notFound } from 'next/navigation';
import { firestore } from '@/lib/db';
import ClientComparePage from './ClientComparePage';

export default async function ComparePage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = await params;
  
  // Verify room exists
  const roomDoc = await firestore.collection('rooms').doc(resolvedParams.roomId).get();
  if (!roomDoc.exists) {
    notFound();
  }

  return <ClientComparePage roomId={resolvedParams.roomId} />;
}
