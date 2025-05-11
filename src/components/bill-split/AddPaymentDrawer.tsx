import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Payment } from '@/lib/split-session';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Drawer } from 'vaul';

interface Participant {
  id: string;
  name: string;
}

interface AddPaymentDrawerProps {
  participants: Participant[];
  onAdd: (payment: Omit<Payment, 'id' | 'createdAt'>) => void;
}

export function AddPaymentDrawer({ participants, onAdd }: AddPaymentDrawerProps) {
  const defaultPayer = participants[0]?.id ?? '';
  const allIds = participants.map((p) => p.id);

  const [open, setOpen] = useState(false);
  const [payerId, setPayerId] = useState<string>(defaultPayer);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>(allIds);

  // Input element ids for accessibility
  const idPayer = 'addpay-payer';
  const idParticipants = 'addpay-target';
  const idDescription = 'addpay-description';
  const idAmount = 'addpay-amount';

  const resetForm = () => {
    setPayerId(defaultPayer);
    setAmount('');
    setDescription('');
    setParticipantIds(allIds);
  };

  const handleSubmit = () => {
    if (!payerId || !amount) return;
    onAdd({ payerId, amount, description, participantIds });
    setOpen(false);
    // reset after close animation
    setTimeout(resetForm, 300);
  };

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} dismissible>
      {/* Trigger */}
      <Drawer.Trigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 focus-visible:ring-2 sm:bottom-8 sm:right-8 transition-opacity data-[state=open]:opacity-0 data-[state=open]:pointer-events-none"
          aria-label="add-payment"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Drawer.Trigger>

      {/* Portal */}
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 mt-24 flex max-h-[85%] flex-col rounded-t-2xl border bg-background pb-4">
          <Drawer.Title className="sr-only">支払いを追加</Drawer.Title>
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />

          <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto p-6 pt-4">
            <h2 className="mb-4 text-center text-lg font-semibold">支払いを追加</h2>

            {/* Payer */}
            <div className="mb-4 space-y-1">
              <label htmlFor={idPayer} className="text-sm font-medium">
                支払者
              </label>
              <Select value={payerId} onValueChange={setPayerId}>
                <SelectTrigger id={idPayer} className="w-full">
                  <SelectValue placeholder="支払者" />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name || '名前未設定'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Participants */}
            <div className="mb-4 space-y-1">
              <label htmlFor={idParticipants} className="text-sm font-medium">
                対象
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button id={idParticipants} variant="outline" className="w-full">
                    {participantIds.length === participants.length
                      ? '全員'
                      : `${participantIds.length}人選択`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {participants.map((p) => (
                    <DropdownMenuCheckboxItem
                      key={p.id}
                      checked={participantIds.includes(p.id)}
                      onCheckedChange={(checked) =>
                        setParticipantIds((prev) =>
                          checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                        )
                      }
                    >
                      {p.name || '名前未設定'}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Description */}
            <div className="mb-4 space-y-1">
              <label htmlFor={idDescription} className="text-sm font-medium">
                説明
              </label>
              <Input
                id={idDescription}
                placeholder="説明 (任意)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Amount */}
            <div className="mb-6 space-y-1">
              <label htmlFor={idAmount} className="text-sm font-medium">
                金額 (¥)
              </label>
              <Input
                id={idAmount}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <Button type="button" className="w-full" onClick={handleSubmit} disabled={!amount}>
              追加する
            </Button>
          </div>

          {/* Close button small */}
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
