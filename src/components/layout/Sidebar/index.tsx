'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConversationList } from './ConversationList';
import { ModeToggle } from './ModeToggle';

export const Sidebar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-9 h-9 hover:bg-secondary/80 transition-all -ml-3"
          aria-label="メニューを開く"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="flex flex-col border-r p-0 w-[280px] sm:w-[320px] z-[40]"
        onEscapeKeyDown={() => setOpen(false)}
        onCloseAutoFocus={(e) => e.preventDefault()}
        hideCloseButton={true}
      >
        <SheetDescription className="sr-only">
          会話履歴とアプリケーションのナビゲーションメニュー
        </SheetDescription>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">L</span>
            </div>
            <SheetTitle className="text-xl">SplitPay</SheetTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8"
            onClick={() => setOpen(false)}
          >
            <span className="sr-only">閉じる</span>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <ConversationList closeMenu={() => setOpen(false)} />
          <div className="mt-4 px-4 space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setOpen(false);
                router.push('/dify');
              }}
            >
              Dify Apps
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setOpen(false);
                router.push('/contact');
              }}
            >
              お問い合わせ
            </Button>
          </div>
        </div>

        <div className="border-t p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">v1.0.0</div>
          <ModeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
};
