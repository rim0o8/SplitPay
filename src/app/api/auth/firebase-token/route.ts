import { auth as adminAuth } from '@/lib/firebase/admin';
import { Config } from '@/utils/config';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // リクエストボディの取得
    const { idToken } = await req.json();
    
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'IDトークンが提供されていません' },
        { status: 400 }
      );
    }
    
    // 本来は、このトークンを検証してから処理を続行する
    // 実際の実装では、Firebase Admin SDKでトークンを検証
    try {
      // トークンを検証
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      
      // Firebaseカスタムトークンを作成
      const customToken = await adminAuth.createCustomToken(uid);
      
      // クライアント側のFirebase SDKを初期化
      const firebaseConfig = {
        apiKey: Config.AUTH_FIREBASE_API_KEY,
        authDomain: Config.AUTH_FIREBASE_AUTH_DOMAIN,
        projectId: Config.AUTH_FIREBASE_PROJECT_ID,
        storageBucket: Config.AUTH_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: Config.AUTH_FIREBASE_MESSAGING_SENDER_ID,
        appId: Config.AUTH_FIREBASE_APP_ID,
        measurementId: Config.AUTH_FIREBASE_MEASUREMENT_ID,
      };
      
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      const auth = getAuth(app);
      
      // カスタムトークンでサインイン
      const userCredential = await signInWithCustomToken(auth, customToken);
      
      return NextResponse.json({
        success: true,
        uid: userCredential.user.uid,
        isAnonymous: userCredential.user.isAnonymous,
      });
    } catch (error) {
      console.error('Firebase認証エラー:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Firebase認証に失敗しました: ${error instanceof Error ? error.message : String(error)}` 
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('サーバーエラー:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `サーバーエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    );
  }
} 