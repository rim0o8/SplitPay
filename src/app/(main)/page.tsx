'use client';

import { CreateSplitDrawer } from '@/components/bill-split/CreateSplitDrawer';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

interface Item {
  id: string;
  title?: string;
  participants: { name: string }[];
  createdAt?: number;
  cleared?: boolean;
}

interface SwipeItemProps {
  item: Item;
  onDelete: (id: string) => void;
}

function SwipeableItem({ item, onDelete }: SwipeItemProps) {
  const [showDelete, setShowDelete] = useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => setShowDelete(true),
    onSwipedRight: () => setShowDelete(false),
    delta: 40,
  });

  const formatTime = (ts?: number) =>
    ts ? new Date(ts).toLocaleString(undefined, { hour12: false }) : '';

  return (
    <div className="relative" {...handlers}>
      {/* Delete button */}
      <button
        type="button"
        className={`absolute inset-y-0 right-0 w-20 bg-red-600 text-white flex items-center justify-center transition-opacity ${
          showDelete ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => onDelete(item.id)}
      >
        削除
      </button>

      {/* Main content */}
      <Link
        href={`/${item.id}`}
        className={`block bg-white w-full rounded-md border p-3 hover:bg-muted transition-transform ${
          showDelete ? '-translate-x-20' : 'translate-x-0'
        } duration-200`}
      >
        <div className="flex flex-col text-left">
          <span className="font-medium truncate">{item.title || '無題の割り勘'}</span>
          <span className="text-xs text-muted-foreground truncate">
            参加者: {item.participants.map((p) => p.name || '名前未設定').join(', ')}
          </span>
          {item.cleared && <span className="text-xs text-green-600">清算済み</span>}
          {item.createdAt && (
            <span className="text-xs text-muted-foreground">
              作成: {formatTime(item.createdAt)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
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

  return (
    <>
      <section className="mx-auto max-w-2xl px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold">最近の割り勘</h1>
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="text-muted-foreground">さあ、割り勘を始めよう</div>
          )}
          {items.map((item) => (
            <SwipeableItem
              key={item.id}
              item={item}
              onDelete={(id) => {
                setItems((prev) => prev.filter((it) => it.id !== id));

                // update localStorage
                try {
                  const key = 'split-recent';
                  const current = JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
                  localStorage.setItem(key, JSON.stringify(current.filter((v) => v !== id)));
                } catch {}

                // delete from backend (fire-and-forget)
                fetch(`/api/split/${id}`, { method: 'DELETE' }).catch(() => {});
              }}
            />
          ))}
          {/* Plus button handled separately */}
        </div>
      </section>

      {/* Floating drawer for creating new split */}
      <CreateSplitDrawer />
    </>
  );
}
