import dynamic from 'next/dynamic';

const ClientComparePage = dynamic(() => import('./ClientComparePage'), { ssr: false });

export default function ComparePage({ params }: { params: { roomId: string } }) {
  return <ClientComparePage roomId={params.roomId} />;
}
