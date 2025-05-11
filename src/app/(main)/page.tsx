'use client';

import { CreateSplitDrawer } from '@/components/bill-split/CreateSplitDrawer';
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
    <>
      <section className="mx-auto max-w-2xl px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold">最近の割り勘</h1>
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="text-muted-foreground">さあ、割り勘を始めよう</div>
          )}
          {items.map((item) => (
            <Link key={item.id} href={`/${item.id}`} className="block">
              <div className="w-full rounded-md border p-3 hover:bg-muted transition-colors">
                <div className="flex flex-col text-left">
                  <span className="font-medium truncate">{item.title || '無題の割り勘'}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    参加者: {item.participants.map((p) => p.name || '名前未設定').join(', ')}
                  </span>
                  {item.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      作成: {formatTime(item.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
          {/* Plus button handled separately */}
        </div>
      </section>

      {/* Floating drawer for creating new split */}
      <CreateSplitDrawer />
    </>
  );
}
