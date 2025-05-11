import { BillSplitForm } from '@/components/bill-split/BillSplitForm';
import type { Payment } from '@/lib/split-session';
import { getSession } from '@/lib/split-session';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SplitSessionPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) return notFound();

  return (
    <BillSplitForm
      key={session.id}
      initialParticipants={session.participants}
      initialPayments={session.payments as Payment[]}
      sessionId={session.id}
      sessionTitle={session.title || '無題の割り勘'}
    />
  );
}
