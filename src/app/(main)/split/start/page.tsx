'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function StartSplitPage() {
  const [names, setNames] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreate = () => {
    const list = names
      .split(/\n|,/)
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
    if (!list.length) return;

    startTransition(async () => {
      const res = await fetch('/api/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants: list }),
      });
      const { id } = await res.json();
      router.push(`/split/${id}`);
    });
  };

  return (
    <Card className="mx-auto max-w-xl p-4 sm:p-6">
      <CardHeader>
        <CardTitle>新しい割り勘を開始</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          as="textarea"
          rows={4}
          placeholder="参加者を改行またはカンマ区切りで入力"
          value={names}
          onChange={(e) => setNames(e.target.value)}
          className="w-full"
        />
        <Button onClick={handleCreate} disabled={isPending} className="w-full sm:w-auto">
          {isPending ? '作成中…' : '割り勘を開始'}
        </Button>
      </CardContent>
    </Card>
  );
}
