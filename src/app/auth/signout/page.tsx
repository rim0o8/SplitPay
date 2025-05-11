'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Route } from 'next';
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function SignOutPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
      router.push('/' as Route);
    } catch (error) {
      console.error('サインアウトエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">サインアウト</CardTitle>
          <CardDescription className="text-center">
            アカウントからサインアウトしますか？
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "サインアウト中..." : "サインアウト"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              キャンセル
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
} 