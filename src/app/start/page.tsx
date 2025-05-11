/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function StartSplitPage() {
  const [title, setTitle] = useState('');
  const [names, setNames] = useState<{ id: string; value: string }[]>([
    { id: nanoid(), value: '' },
  ]);
  const [isPending, startTransition] = useTransition();
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
      router.push(`/split/${id}`);
    });
  };

  const handleNameChange = (id: string, value: string) =>
    setNames(names.map((n) => (n.id === id ? { ...n, value } : n)));

  const addField = () => setNames([...names, { id: nanoid(), value: '' }]);
  const removeField = (id: string) => setNames(names.filter((n) => n.id !== id));

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
          {names.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-[1fr_auto] gap-2">
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
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addField}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-1" /> 参加者を追加
          </Button>
        </div>

        <Button onClick={handleCreate} disabled={isPending} className="w-full sm:w-auto">
          {isPending ? '作成中…' : '割り勘を開始'}
        </Button>
      </CardContent>
    </Card>
  );
}
