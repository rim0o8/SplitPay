'use client';

import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

// 実際のサインアップコンポーネント
function SignUpComponent() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/subscription";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // パスワード確認
        if (password !== confirmPassword) {
            setError("パスワードが一致しません");
            setIsLoading(false);
            return;
        }

        // パスワード強度チェック
        if (password.length < 6) {
            setError("パスワードは6文字以上にしてください");
            setIsLoading(false);
            return;
        }

        try {
            // バックエンドAPIを使用してユーザー作成
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'アカウント作成に失敗しました');
            }

            // 作成後、NextAuthでログイン
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
                callbackUrl,
            });

            if (result?.error) {
                setError("アカウント作成後のログインに失敗しました。ログインページからログインしてください。");
            } else if (result?.url) {
                window.location.href = result.url;
            }
        } catch (error: unknown) {
            console.error("サインアップエラー:", error);
            
            // エラーメッセージの表示
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("アカウント作成中にエラーが発生しました。後でもう一度お試しください。");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError("");
        
        try {
            // NextAuthのGoogleプロバイダーを使用
            await signIn("google", {
                callbackUrl,
            });
            // リダイレクトするので、この後の処理は実行されない
        } catch (error) {
            console.error("Googleログインエラー:", error);
            setError("Googleログイン中にエラーが発生しました。後でもう一度お試しください。");
            setIsLoading(false);
        }
    };

    return (
        <div className="container flex items-center justify-center min-h-screen py-10">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">アカウント作成</CardTitle>
                    <CardDescription className="text-center">
                        新しいアカウントを作成して始めましょう
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">メールアドレス</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">パスワード</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                パスワードは6文字以上にしてください
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "登録中..." : "アカウント作成"}
                        </Button>
                    </form>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">または</span>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        type="button"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                    >
                        <GoogleIcon />
                        <span>Googleでサインアップ</span>
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <div className="text-sm text-center text-muted-foreground">
                        既にアカウントをお持ちの場合は、
                        <Link href="/auth/signin" className="text-primary hover:underline">
                            ログイン
                        </Link>
                        してください。
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

// サスペンスでラップしたエクスポート用コンポーネント
export default function SignUpPage() {
    return (
        <Suspense fallback={<div className="container flex items-center justify-center min-h-screen">読み込み中...</div>}>
            <SignUpComponent />
        </Suspense>
    );
} 