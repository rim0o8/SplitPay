import type { Payment } from '@/components/bill-split/BillSplitForm';
import { BillSplitForm } from '@/components/bill-split/BillSplitForm';
import { getSession } from '@/lib/split-session';
import { notFound } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default async function SplitSessionPage({ params }: Props) {
  const session = await getSession(params.id);
  if (!session) return notFound();

  return (
    <BillSplitForm
      key={session.id}
      initialParticipants={session.participants}
      initialPayments={session.payments as Payment[]}
      sessionId={session.id}
    />
  );
}
