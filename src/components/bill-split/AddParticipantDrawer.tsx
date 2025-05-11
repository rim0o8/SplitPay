import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import { Drawer } from 'vaul';

interface AddParticipantDrawerProps {
  onAdd: (participant: { id: string; value: string }) => void;
  nextIndex: number;
  fixedTrigger?: boolean;
}

export function AddParticipantDrawer({
  onAdd,
  nextIndex,
  fixedTrigger,
}: AddParticipantDrawerProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const reset = () => setName('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ id: nanoid(), value: trimmed });
    setOpen(false);
    setTimeout(reset, 300);
  };

  const triggerClasses = fixedTrigger
    ? 'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 focus-visible:ring-2 sm:bottom-8 sm:right-8'
    : 'w-full sm:w-auto';

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} dismissible>
      <Drawer.Trigger asChild>
        <Button
          type="button"
          variant={fixedTrigger ? 'default' : 'outline'}
          size={fixedTrigger ? 'icon' : 'sm'}
          className={triggerClasses}
        >
          <Plus className={fixedTrigger ? 'h-6 w-6' : 'h-4 w-4 mr-1'} />
          {fixedTrigger ? null : '参加者を追加'}
        </Button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 mt-24 flex max-h-[75%] flex-col rounded-t-2xl border bg-background pb-4">
          <Drawer.Title className="sr-only">参加者を追加</Drawer.Title>
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />
          <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto p-6 pt-4">
            <h2 className="mb-4 text-center text-lg font-semibold">参加者を追加</h2>
            <div className="mb-6 space-y-1">
              <label htmlFor="participant-name" className="text-sm font-medium">
                名前
              </label>
              <Input
                id="participant-name"
                placeholder={`参加者 ${nextIndex}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={!name.trim()}>
              追加する
            </Button>
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
