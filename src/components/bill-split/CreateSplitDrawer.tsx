import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useKeyboardAwareDrawer } from '@/hooks/useKeyboardAwareDrawer';
import { Plus, X } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { Drawer } from 'vaul';

interface ParticipantField {
  id: string;
  value: string;
}

export function CreateSplitDrawer() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [names, setNames] = useState<ParticipantField[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  useKeyboardAwareDrawer(contentRef);

  const handleAddField = () => setNames((prev) => [...prev, { id: nanoid(), value: '' }]);
  const handleRemoveField = (id: string) => setNames((prev) => prev.filter((n) => n.id !== id));
  const handleNameChange = (id: string, value: string) =>
    setNames((prev) => prev.map((n) => (n.id === id ? { ...n, value } : n)));

  const canCreate = names.some((n) => n.value.trim());

  const handleCreate = () => {
    if (!canCreate) return;
    const list = names
      .map((n) => n.value.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    startTransition(async () => {
      const res = await fetch('/api/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), participants: list }),
      });
      const { id } = await res.json();
      setOpen(false);
      router.push(`/${id}`);
    });
  };

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} dismissible>
      <Drawer.Trigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 focus-visible:ring-2 sm:bottom-8 sm:right-8 transition-opacity data-[state=open]:opacity-0 data-[state=open]:pointer-events-none"
          aria-label="create-split"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content
          ref={contentRef}
          className="fixed bottom-0 left-0 right-0 mt-24 flex max-h-[90%] flex-col rounded-t-2xl border bg-background pb-4"
        >
          <Drawer.Title className="sr-only">新しい割り勘を開始</Drawer.Title>
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />

          <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto p-6 pt-4 space-y-4">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">新しい割り勘を開始</CardTitle>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveField(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddField}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-1" /> 参加者を追加
                  </Button>
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
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
