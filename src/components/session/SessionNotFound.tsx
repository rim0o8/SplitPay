'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface Props {
  id: string;
}

export default function SessionNotFound({ id }: Props) {
  const router = useRouter();

  useEffect(() => {
    try {
      const key = 'split-recent';
      const stored: string[] = JSON.parse(localStorage.getItem(key) ?? '[]');
      const updated = stored.filter((v) => v !== id);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {}
  }, [id]);

  return (
    <Card className="mx-auto max-w-md p-4 sm:p-6 text-center space-y-4">
      <CardHeader>
        <CardTitle>セッションが見つかりません</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">この割り勘セッションは存在しないか、期限切れです。</p>
        <Button onClick={() => router.push('/')}>ホームへ戻る</Button>
      </CardContent>
    </Card>
  );
}
