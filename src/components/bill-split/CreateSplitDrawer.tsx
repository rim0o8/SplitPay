import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Drawer } from 'vaul';

interface ParticipantField {
  id: string;
  value: string;
}

export function CreateSplitDrawer() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [names, setNames] = useState<ParticipantField[]>([]);
  const [focusId, setFocusId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAddField = () => {
    const id = nanoid();
    setNames((prev) => [...prev, { id, value: '' }]);
    setFocusId(id);
    // blur currently focused element so that new input can take focus (especially on mobile Safari)
    (document.activeElement as HTMLElement | null)?.blur();

    // Fallback: attempt to focus the new input after next paint
    setTimeout(() => {
      inputRefs.current[id]?.focus();
    }, 50);
  };
  const handleRemoveField = (id: string) => setNames((prev) => prev.filter((n) => n.id !== id));
  const handleNameChange = (id: string, value: string) =>
    setNames((prev) => prev.map((n) => (n.id === id ? { ...n, value } : n)));

  useEffect(() => {
    if (focusId) {
      inputRefs.current[focusId]?.focus();
      setFocusId(null);
    }
  }, [focusId]);

  // focus title when drawer opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => {
        titleRef.current?.focus();
      }, 400); // wait for drawer animation to finish
      return () => clearTimeout(t);
    }
  }, [open]);

  const trimmedNames = names.map((n) => n.value.trim()).filter(Boolean);
  const duplicateNameSet = new Set(
    trimmedNames.filter((name, idx) => trimmedNames.indexOf(name) !== idx)
  );
  const hasDuplicateNames = duplicateNameSet.size > 0;

  const canCreate = names.some((n) => n.value.trim()) && !hasDuplicateNames;

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
        <Drawer.Content className="fixed inset-x-0 bottom-0 top-16 flex flex-col rounded-t-2xl border bg-background pb-4 sm:top-auto sm:mt-24 sm:max-h-[90%]">
          <Drawer.Title className="sr-only">新しい割り勘を開始</Drawer.Title>
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />

          <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto p-6 pt-4 space-y-4">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">新しい割り勘を開始</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  ref={titleRef}
                  placeholder="タイトル (例: 沖縄旅行)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />

                <div className="space-y-2">
                  {names.map((item, idx) => {
                    const isDuplicate = duplicateNameSet.has(item.value.trim());
                    return (
                      <div key={item.id} className="grid grid-cols-[1fr_auto] gap-2">
                        <Input
                          ref={(el) => {
                            inputRefs.current[item.id] = el;
                          }}
                          placeholder={`参加者 ${idx + 1}`}
                          value={item.value}
                          onChange={(e) => handleNameChange(item.id, e.target.value)}
                          className={cn(
                            isDuplicate &&
                              'border-destructive focus-visible:ring-destructive focus-visible:ring-offset-0'
                          )}
                          aria-invalid={isDuplicate}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveField(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
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

                {hasDuplicateNames && (
                  <p className="text-sm text-destructive">
                    同じ名前の参加者がいます。別の名前を入力してください。
                  </p>
                )}

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
