import { BillSplitForm } from '@/components/bill-split/BillSplitForm';
import SessionNotFound from '@/components/session/SessionNotFound';
import type { Payment } from '@/lib/split-session';
import { getSession } from '@/lib/split-session';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SplitSessionPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) return <SessionNotFound id={id} />;

  return (
    <BillSplitForm
      key={session.id}
      initialParticipants={session.participants}
      initialPayments={session.payments as Payment[]}
      initialDoneSettlements={session.doneSettlements}
      initialCleared={session.cleared}
      sessionId={session.id}
      sessionTitle={session.title || '無題の割り勘'}
    />
  );
}
