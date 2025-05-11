import { Config } from '@/utils/config';
import { getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Firebaseの設定
const firebaseConfig = {
  apiKey: Config.AUTH_FIREBASE_API_KEY,
  authDomain: Config.AUTH_FIREBASE_AUTH_DOMAIN,
  projectId: Config.AUTH_FIREBASE_PROJECT_ID,
  storageBucket: Config.AUTH_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Config.AUTH_FIREBASE_MESSAGING_SENDER_ID,
  appId: Config.AUTH_FIREBASE_APP_ID,
  measurementId: Config.AUTH_FIREBASE_MEASUREMENT_ID,
};

// Firebaseの初期化（まだ初期化されていない場合のみ）
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 入力検証
    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上にしてください' },
        { status: 400 }
      );
    }

    // Firebaseでユーザー作成
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return NextResponse.json({
      success: true,
      uid: user.uid,
      email: user.email,
    });
  } catch (error) {
    console.error('サインアップエラー:', error);

    // Firebase認証エラーのハンドリング
    const firebaseError = error as { code?: string };
    
    if (firebaseError.code === 'auth/email-already-in-use') {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }
    
    if (firebaseError.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'メールアドレスの形式が正しくありません' },
        { status: 400 }
      );
    }
    
    if (firebaseError.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'パスワードは6文字以上にしてください' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'アカウント作成中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 