'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Route } from 'next';
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
// 実際のエラーコンポーネント
function ErrorComponent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // エラーメッセージのマッピング
  const errorMessages: Record<string, string> = {
    default: "認証中にエラーが発生しました。",
    configuration: "サーバー設定に問題があります。",
    accessdenied: "アクセスが拒否されました。",
    verification: "メールアドレスの確認に失敗しました。",
    signin: "サインインに失敗しました。",
    oauthsignin: "OAuthプロバイダーでのサインインに失敗しました。",
    oauthcallback: "OAuthコールバックでエラーが発生しました。",
    oauthcreateaccount: "OAuthアカウントの作成に失敗しました。",
    emailcreateaccount: "メールアカウントの作成に失敗しました。",
    callback: "コールバック処理中にエラーが発生しました。",
    oauthaccountnotlinked: "このアカウントは既に別の認証方法で登録されています。",
    sessionrequired: "このページにアクセスするにはログインが必要です。",
  };

  const errorMessage = error && errorMessages[error] ? errorMessages[error] : errorMessages.default;

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">認証エラー</CardTitle>
          <CardDescription className="text-center">
            {errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth/signin">
                サインインページに戻る
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={"/" as Route}>
                ホームに戻る
              </Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center text-muted-foreground">
            問題が解決しない場合は、
            <a href="mailto:support@example.com" className="text-primary hover:underline">
              サポート
            </a>
            にお問い合わせください。
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// サスペンスでラップしたエクスポート用コンポーネント
export default function ErrorPage() {
  return (
    <Suspense fallback={<div className="container flex items-center justify-center min-h-screen">読み込み中...</div>}>
      <ErrorComponent />
    </Suspense>
  );
} 