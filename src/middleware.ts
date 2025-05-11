import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Config } from './utils/config';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

// 認証が不要なパスのリスト
const publicPaths = [
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
  '/auth/welcome',
  '/auth/signout',
  '/about',
  '/contact',
  '/legal',
];

// パスが公開パスかどうかをチェックする関数
function isPublicPath(path: string): boolean {
  // ルートパスの特別処理
  if (path === '/') {
    return true;
  }

  // 他のパスの完全一致または前方一致チェック
  return publicPaths.some(
    (publicPath) => path === publicPath || (publicPath !== '/' && path.startsWith(`${publicPath}/`))
  );
}

// 環境変数WITH_AUTHがtrueの場合のみ認証を適用
export default async function middleware(req: NextRequest) {
  const withAuthEnabled = Config.WITH_AUTH;
  const path = req.nextUrl.pathname;

  // 認証が無効な場合は、リクエストをそのまま通過させる
  if (!withAuthEnabled) {
    return NextResponse.next();
  }

  // トークンをチェック
  const token = await getToken({
    req: req as unknown as NextRequest,
    secret: Config.NEXTAUTH_SECRET,
  });

  // 公開パスの場合は認証チェックをスキップ
  if (isPublicPath(path)) {
    return NextResponse.next();
  }

  // トークンが存在しない場合は未認証
  if (!token) {
    console.log('認証トークンが存在しません。ログイン画面にリダイレクトします');
    // 現在のURLをcallbackUrlとして渡す
    const callbackUrl = encodeURIComponent(req.url);
    return NextResponse.redirect(new URL(`/auth/welcome?callbackUrl=${callbackUrl}`, req.url));
  }

  // デバッグ用ログ
  const now = Math.floor(Date.now() / 1000);

  // トークンの有効期限をチェック
  if (token.expiresAt && typeof token.expiresAt === 'number' && now >= token.expiresAt) {
    console.log('トークンの有効期限が切れています。ログイン画面にリダイレクトします');

    // ここでJWT更新を待つ代わりに直接ログイン画面にリダイレクトする
    // JWT更新はNextAuthの内部でcallbackを通して処理される
    const callbackUrl = encodeURIComponent(req.url);
    return NextResponse.redirect(new URL(`/auth/welcome?callbackUrl=${callbackUrl}`, req.url));
  }

  // 認証済みの場合は、リクエストをそのまま通過させる
  return NextResponse.next();
}
