'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Payment } from '@/lib/split-session';
import { ChevronDown, ChevronUp, Share2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { AddPaymentDrawer } from './AddPaymentDrawer';
import { PaymentDrawer } from './PaymentDrawer';

interface Participant {
  id: string;
  name: string;
}

interface Result {
  name: string;
  net: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface BillSplitFormProps {
  initialParticipants?: Participant[];
  initialPayments?: Payment[];
  initialDoneSettlements?: string[];
  initialCleared?: boolean;
  sessionId: string;
  sessionTitle: string;
}

export function BillSplitForm({
  initialParticipants,
  initialPayments,
  initialDoneSettlements,
  initialCleared: _initialCleared,
  sessionId,
  sessionTitle,
}: BillSplitFormProps) {
  const [participants, setParticipants] = useState<Participant[]>(
    initialParticipants?.length ? initialParticipants : [{ id: crypto.randomUUID(), name: '' }]
  );

  const [payments, setPayments] = useState<Payment[]>(initialPayments ?? []);

  const [participantsOpen, setParticipantsOpen] = useState(false);

  // index of participant pending deletion (null = none)
  const [deleteTarget, setDeleteTarget] = useState<{
    index: number;
    id: string;
    name: string;
  } | null>(null);

  // State to track settlement completion
  const [doneSettlements, setDoneSettlements] = useState<Set<string>>(
    () => new Set(initialDoneSettlements ?? [])
  );

  /* ---------- Calculation ---------- */

  const calculation = useMemo(() => {
    if (!participants.length || !payments.length) return { results: null, settlements: null };

    // Map participantId -> name
    const idToName: Record<string, string> = {};
    let idx = 0;
    for (const p of participants) {
      idToName[p.id] = p.name.trim() || `Person ${idx + 1}`;
      idx += 1;
    }

    // Maps for paid and owed amounts
    const paidMap: Record<string, number> = {};
    const owedMap: Record<string, number> = {};
    for (const p of participants) {
      paidMap[p.id] = 0;
      owedMap[p.id] = 0;
    }

    for (const pay of payments) {
      const amt = Number.parseFloat(pay.amount) || 0;
      paidMap[pay.payerId] += amt;

      const targets = pay.participantIds.length
        ? pay.participantIds
        : participants.map((p) => p.id);
      const share = targets.length ? amt / targets.length : 0;
      for (const id of targets) owedMap[id] += share;
    }

    const results: Result[] = participants.map((p) => {
      const net = Math.round((paidMap[p.id] - owedMap[p.id]) * 100) / 100;
      return { name: idToName[p.id], net };
    });

    // Build settlements
    interface BalEntry {
      id: string;
      amount: number;
    }
    const creditors: BalEntry[] = [];
    const debtors: BalEntry[] = [];
    for (const p of participants) {
      const net = Math.round((paidMap[p.id] - owedMap[p.id]) * 100) / 100;
      if (net > 0) creditors.push({ id: p.id, amount: net });
      else if (net < 0) debtors.push({ id: p.id, amount: -net });
    }
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const settlements: Settlement[] = [];
    while (creditors.length && debtors.length) {
      const creditor = creditors[0];
      const debtor = debtors[0];
      const amount = Math.min(creditor.amount, debtor.amount);
      settlements.push({
        from: idToName[debtor.id],
        to: idToName[creditor.id],
        amount: Math.round(amount * 100) / 100,
      });
      creditor.amount -= amount;
      debtor.amount -= amount;
      if (creditor.amount === 0) creditors.shift();
      if (debtor.amount === 0) debtors.shift();
    }

    return { results, settlements };
  }, [participants, payments]);

  const { results, settlements } = calculation;

  /* ---------- Sync to backend ---------- */
  useEffect(() => {
    if (!sessionId) return;

    // cache session id list in localStorage (unchanged)
    try {
      const key = 'split-recent';
      const current = JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
      if (!current.includes(sessionId)) {
        current.unshift(sessionId);
        localStorage.setItem(key, JSON.stringify(current.slice(0, 10)));
      }
    } catch {}

    const timer = setTimeout(() => {
      const allCleared =
        settlements && settlements.length > 0 && doneSettlements.size === settlements.length;

      // fire-and-forget
      fetch(`/api/split/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participants,
          payments,
          doneSettlements: Array.from(doneSettlements),
          cleared: allCleared,
        }),
      }).catch((err) => {
        if (process.env.NODE_ENV !== 'production') console.error(err);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [participants, payments, doneSettlements, settlements, sessionId]);

  /* ---------- Settlement Status Helpers ---------- */
  const toggleSettlement = (key: string) => {
    setDoneSettlements((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    if (!settlements) return;
    setDoneSettlements((prev) => {
      const keys = new Set(settlements.map((s) => `${s.from}-${s.to}-${s.amount}`));
      const filtered = new Set<string>();
      for (const k of Array.from(prev)) {
        if (keys.has(k)) filtered.add(k);
      }
      return filtered;
    });
  }, [settlements]);

  /* ---------- Participants ---------- */
  const handleAddParticipant = () =>
    setParticipants([...participants, { id: crypto.randomUUID(), name: '' }]);

  const handleRemoveParticipant = (index: number) => {
    const target = participants[index];
    if (!target) return;
    setDeleteTarget({ index, id: target.id, name: target.name });
  };

  const confirmRemoveParticipant = () => {
    if (!deleteTarget) return;
    const { index, id } = deleteTarget;
    // remove participant
    setParticipants((prev) => prev.filter((_, i) => i !== index));
    // remove related payments (payer or participant)
    setPayments((prev) =>
      prev.filter((pay) => pay.payerId !== id && !pay.participantIds.includes(id))
    );
    setDeleteTarget(null);
  };

  const handleParticipantChange = (index: number, name: string) => {
    const updated = [...participants];
    updated[index].name = name;
    setParticipants(updated);
  };

  const handleRemovePayment = (index: number) =>
    setPayments(payments.filter((_, i) => i !== index));

  const handlePaymentChange = <T extends keyof Payment>(
    index: number,
    field: T,
    value: Payment[T]
  ) => {
    const updated = [...payments];
    updated[index][field] = value;
    setPayments(updated);
  };

  /* ---------- Drawer-based Addition ---------- */
  const handleAddPayment = (data: Omit<Payment, 'id' | 'createdAt'>) => {
    const newPayment: Payment = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      ...data,
    };
    setPayments((prev) => [...prev, newPayment]);
  };

  /* ---------- Utils ---------- */
  const formatTime = (ts?: number) =>
    ts ? new Date(ts).toLocaleString(undefined, { hour12: false }) : '';

  /* ---------- Swipeable Payment Row ---------- */
  interface PaymentRowProps {
    payment: Payment;
    index: number;
  }

  function SwipeablePaymentRow({ payment, index }: PaymentRowProps) {
    const [showDelete, setShowDelete] = useState(false);

    const handlers = useSwipeable({
      onSwipedLeft: () => setShowDelete(true),
      onSwipedRight: () => setShowDelete(false),
      delta: 40,
    });

    return (
      <div className="relative" {...handlers}>
        <button
          type="button"
          className={`absolute inset-y-0 right-0 w-16 bg-red-600 text-white flex items-center justify-center transition-opacity ${
            showDelete ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => handleRemovePayment(index)}
        >
          削除
        </button>

        <div
          className={`transition-transform duration-200 ${
            showDelete ? '-translate-x-16' : 'translate-x-0'
          }`}
        >
          <PaymentDrawer
            participants={participants}
            payment={payment}
            onSave={(updated) => {
              setPayments((prev) => prev.map((p, i) => (i === index ? updated : p)));
            }}
            onDelete={() => handleRemovePayment(index)}
          />
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    try {
      const url = window.location.href;
      const data: ShareData = {
        title: sessionTitle,
        text: '割り勘に参加してください',
        url,
      };
      if (navigator.share && navigator.canShare?.(data)) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(url);
        alert('リンクをコピーしました');
      }
    } catch {}
  };

  return (
    <>
      <div className="mx-auto w-full max-w-5xl lg:max-w-6xl p-4 sm:p-6 space-y-6">
        <div className="flex flex-row items-center justify-between gap-2 mb-6">
          <h1 className="text-lg font-semibold">{sessionTitle}</h1>
          <Button variant="ghost" size="icon" onClick={handleShare} aria-label="share-link">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Participants Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">参加者</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setParticipantsOpen((prev) => !prev)}
              aria-label="toggle-participants"
            >
              {participantsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {participantsOpen && (
            <>
              {participants.map((p, index) => (
                <div key={p.id} className="grid w-full grid-cols-[1fr_auto] gap-2">
                  <Input
                    placeholder="名前"
                    value={p.name}
                    onChange={(e) => handleParticipantChange(index, e.target.value)}
                    className="w-full"
                  />
                  {participants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveParticipant(index)}
                      aria-label="remove-participant"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleAddParticipant}
              >
                参加者を追加
              </Button>
            </>
          )}
        </div>

        {/* Payments Section */}
        <div className="space-y-2">
          <h3 className="font-semibold">支払い履歴</h3>
          {payments.map((payment, index) => (
            <SwipeablePaymentRow key={payment.id} payment={payment} index={index} />
          ))}
        </div>

        <div className="flex flex-col items-stretch gap-6 pt-6">
          {results && (
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">支払い状況</h3>
                <div className="space-y-1">
                  {results.map(({ name, net }) => (
                    <div key={name} className="flex justify-between text-sm border rounded-md p-2">
                      <span>{name}</span>
                      <span
                        className={
                          net === 0
                            ? 'text-muted-foreground'
                            : net > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {net === 0 ? '±0' : `${net > 0 ? '+' : ''}${net.toFixed(2)}¥`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {settlements && settlements.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">精算案</h3>
                  <div className="space-y-1">
                    {settlements.map((s) => {
                      const key = `${s.from}-${s.to}-${s.amount}`;
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-2 text-sm border rounded-md p-2"
                        >
                          <Checkbox
                            checked={doneSettlements.has(key)}
                            onCheckedChange={() => toggleSettlement(key)}
                            aria-label="settled"
                          />
                          <div className="flex-1">
                            <span className="font-medium">{s.from}</span> ➡️ {s.to}
                            <span className="ml-2 font-semibold">{s.amount.toFixed(2)}¥</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Floating drawer trigger */}
      <AddPaymentDrawer participants={participants} onAdd={handleAddPayment} />

      {/* ---------- Delete Confirmation Dialog ---------- */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <X className="h-5 w-5" /> 参加者を削除しますか？
            </DialogTitle>
            <DialogDescription>
              "{deleteTarget?.name || 'この参加者'}" を削除すると、この参加者が含まれる支払い履歴も
              全て削除されます。この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={confirmRemoveParticipant}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
