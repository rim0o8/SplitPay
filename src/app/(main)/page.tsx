'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Item {
  id: string;
  title?: string;
  participants: { name: string }[];
  createdAt?: number;
}

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const key = 'split-recent';
    const ids: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
    if (!ids.length) return;
    Promise.all(
      ids.map((id) =>
        fetch(`/api/split/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((res) => {
      const filtered = res.filter(Boolean) as Item[];
      setItems(filtered);
    });
  }, []);

  const formatTime = (ts?: number) =>
    ts ? new Date(ts).toLocaleString(undefined, { hour12: false }) : '';

  return (
    <Card className="mx-auto max-w-xl p-4 sm:p-6 space-y-4">
      <CardHeader>
        <CardTitle>最近の割り勘</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && <div className="text-muted-foreground">さあ、割り勘を始めよう</div>}
        {items.map((item) => (
          <Link key={item.id} href={`/${item.id}`} className="block">
            <Button variant="outline" className="w-full justify-start">
              <div className="flex flex-col text-left">
                <span className="font-medium truncate">{item.title || '無題の割り勘'}</span>
                <span className="text-xs text-muted-foreground">
                  参加者: {item.participants.map((p) => p.name || '名前未設定').join(', ')}
                </span>
                {item.createdAt && (
                  <span className="text-xs text-muted-foreground">
                    作成: {formatTime(item.createdAt)}
                  </span>
                )}
              </div>
            </Button>
          </Link>
        ))}
        <Link href="/start" className="block pt-4">
          <Button className="w-full">新しい割り勘を開始</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
