import { Button } from '@/components/ui/button';
import { FileText, Home, Info, LogOut, MessageSquare, Plus } from 'lucide-react';
import type { Route } from 'next';
import { signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';

interface ConversationListProps {
  closeMenu?: () => void;
}

export function ConversationList({ closeMenu }: ConversationListProps) {
  const router = useRouter();
  const pathname = usePathname();

  // 新しい会話を開始
  const handleNewConversation = () => {
    router.push('/chat');
    if (closeMenu) closeMenu();
  };

  // 会話を削除
  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 現在のページが削除された会話のページである場合、新しいチャットページにリダイレクト
    if (pathname === `/chat/${id}`) {
      router.push('/chat');
    }
  };

  // ナビゲーション処理
  const handleNavigation = (path: string) => {
    if (path === '/') {
      router.push('/' as Route);
    } else if (path === '/chat') {
      router.push('/chat');
    } else if (path === '/about') {
      router.push('/about');
    } else if (path === '/deep-research') {
      router.push('/deep-research');
    } else {
      // 他のパスは未実装
      alert('このページは準備中です');
      return;
    }

    if (closeMenu) closeMenu();
  };

  return (
    <div className="px-2 py-2 flex flex-col h-full">
      <div className="flex-1">
        <div className="space-y-1 mb-6">
          <Button
            variant={pathname === '/' ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2"
            onClick={() => handleNavigation('/')}
          >
            <Home className="h-4 w-4" />
            ホーム
          </Button>

          {/* Deep Research - 区切り線とスペースを追加して目立たせる */}
          <div className="my-3 border-t pt-3">
            <Button
              variant={pathname === '/deep-research' ? 'secondary' : 'default'}
              className="w-full justify-start gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all py-5"
              onClick={() => handleNavigation('/deep-research')}
            >
              <FileText className="h-5 w-5" />
              <span className="font-semibold">ディープリサーチ</span>
            </Button>
          </div>

          <div className="my-2 border-t pt-2">
            <Button
              variant={pathname === '/chat' && !pathname.includes('/chat/') ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
              onClick={() => handleNavigation('/chat')}
            >
              <MessageSquare className="h-4 w-4" />
              新しい会話
            </Button>
          </div>

          <Button
            variant={pathname === '/about' ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2"
            onClick={() => handleNavigation('/about')}
          >
            <Info className="h-4 w-4" />
            このアプリについて
          </Button>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 py-2">
            <h3 className="text-xs font-medium text-muted-foreground">会話履歴</h3>
            <Button
              onClick={handleNewConversation}
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ログアウトボタン */}
      <div className="mt-auto pt-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </Button>
      </div>
    </div>
  );
}
