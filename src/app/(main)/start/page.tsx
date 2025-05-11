/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { AddParticipantDrawer } from '@/components/bill-split/AddParticipantDrawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function StartSplitPage() {
  const [title, setTitle] = useState('');
  const [names, setNames] = useState<{ id: string; value: string }[]>([]);
  const [isPending, startTransition] = useTransition();
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();

  const handleCreate = () => {
    const list = names
      .map((n) => n.value.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
    if (!list.length) return;

    startTransition(async () => {
      const res = await fetch('/api/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), participants: list }),
      });
      const { id } = await res.json();
      router.push(`/${id}`);
    });
  };

  const handleNameChange = (id: string, value: string) =>
    setNames(names.map((n) => (n.id === id ? { ...n, value } : n)));

  const removeField = (id: string) => setNames(names.filter((n) => n.id !== id));

  const handleAddParticipantFromDrawer = (participant: { id: string; value: string }) => {
    setNames((prev) => [...prev, participant]);
  };

  const canCreate = names.some((n) => n.value.trim());

  return (
    <Card className="mx-auto max-w-xl p-4 sm:p-6">
      <CardHeader>
        <CardTitle>新しい割り勘を開始</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="セッションタイトル (例: 沖縄旅行)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {names.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 280, damping: 24 }
                }
                className="grid grid-cols-[1fr_auto] gap-2"
              >
                <Input
                  placeholder={`参加者 ${idx + 1}`}
                  value={item.value}
                  onChange={(e) => handleNameChange(item.id, e.target.value)}
                />
                {names.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeField(item.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <AddParticipantDrawer
            onAdd={handleAddParticipantFromDrawer}
            nextIndex={names.length + 1}
            fixedTrigger
          />
        </div>

        <Button
          onClick={handleCreate}
          disabled={isPending || !canCreate}
          className="w-full sm:w-auto"
        >
          {isPending ? '作成中…' : '割り勘を開始'}
        </Button>
      </CardContent>
    </Card>
  );
}
