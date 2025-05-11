'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Route } from 'next';
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { Suspense } from "react";

// 実際のウェルカムコンポーネント
const WelcomeComponent: React.FC = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">ようこそ</CardTitle>
          <CardDescription className="text-center">
            続行するにはログインまたは新規登録が必要です
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
                ログイン
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
                新規登録
              </Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center text-muted-foreground">
            <Link href={"/" as Route} className="text-primary hover:underline">
              ホームに戻る
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

// サスペンスでラップしたエクスポート用コンポーネント
const WelcomePage: React.FC = () => {
  return (
    <Suspense fallback={<div className="container flex items-center justify-center min-h-screen">読み込み中...</div>}>
      <WelcomeComponent />
    </Suspense>
  );
};

export default WelcomePage; 