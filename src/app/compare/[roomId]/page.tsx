import ClientComparePage from './ClientComparePage';

export default async function ComparePage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = await params;
  return <ClientComparePage roomId={resolvedParams.roomId} />;
}
