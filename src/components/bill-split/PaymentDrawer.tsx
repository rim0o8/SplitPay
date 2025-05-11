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
import { Pencil, X } from 'lucide-react';
import { useState } from 'react';
import { Drawer } from 'vaul';

interface Participant {
  id: string;
  name: string;
}

interface PaymentDrawerProps {
  participants: Participant[];
  payment: Payment;
  onSave: (payment: Payment) => void;
  onDelete: () => void;
}

export function PaymentDrawer({ participants, payment, onSave, onDelete }: PaymentDrawerProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<Payment>({ ...payment });

  const handleChange = <T extends keyof Payment>(field: T, value: Payment[T]) =>
    setState((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    onSave({ ...state });
    setOpen(false);
  };

  const allIds = participants.map((p) => p.id);

  const payerName = participants.find((p) => p.id === payment.payerId)?.name || '???';
  const targetsLabel =
    payment.participantIds.length === participants.length
      ? '全員'
      : `${payment.participantIds.length}人`;

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} dismissible repositionInputs={false}>
      <Drawer.Trigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="truncate text-left flex-1">{payment.description || '（説明なし）'}</span>
          <span className="ml-2 whitespace-nowrap text-muted-foreground text-sm">
            {payerName} / {targetsLabel}
          </span>
          <span className="ml-4 font-semibold">{payment.amount}¥</span>
          <Pencil className="ml-2 h-4 w-4 text-muted-foreground" />
        </Button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 flex flex-col rounded-t-2xl border bg-background pb-4 max-h-[85vh] sm:max-h-[90%]">
          <Drawer.Title className="sr-only">支払い編集</Drawer.Title>
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />

          <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto p-6 pt-4 space-y-4">
            <h2 className="text-center text-lg font-semibold">支払いを編集</h2>

            {/* Payer */}
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="edit-payer">
                支払者
              </label>
              <Select value={state.payerId} onValueChange={(v) => handleChange('payerId', v)}>
                <SelectTrigger id="edit-payer" className="w-full">
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
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="edit-targets">
                対象
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button id="edit-targets" variant="outline" className="w-full">
                    {state.participantIds.length === participants.length
                      ? '全員'
                      : `${state.participantIds.length}人選択`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {participants.map((p) => (
                    <DropdownMenuCheckboxItem
                      key={p.id}
                      checked={state.participantIds.includes(p.id)}
                      onCheckedChange={(checked) => {
                        handleChange(
                          'participantIds',
                          checked
                            ? [...state.participantIds, p.id]
                            : state.participantIds.filter((id) => id !== p.id)
                        );
                      }}
                    >
                      {p.name || '名前未設定'}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="edit-desc">
                説明
              </label>
              <Input
                id="edit-desc"
                placeholder="説明"
                value={state.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="edit-amount">
                金額 (¥)
              </label>
              <Input
                id="edit-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={state.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleSubmit}>
                保存
              </Button>
              <Button variant="destructive" className="flex-1" onClick={onDelete}>
                削除
              </Button>
            </div>
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
