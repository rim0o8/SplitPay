import { auth as adminAuth } from '@/lib/firebase/admin';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // リクエストボディからトークンを取得
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: '認証トークンが提供されていません' },
        { status: 400 }
      );
    }
    
    try {
      // Firebase Admin SDKでトークンを検証
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      return NextResponse.json({
        success: true,
        uid: decodedToken.uid,
        isAnonymous: decodedToken.firebase?.sign_in_provider === 'anonymous',
        email: decodedToken.email || null,
      });
    } catch (error) {
      console.error('トークン検証エラー:', error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `トークンの検証に失敗しました: ${error instanceof Error ? error.message : String(error)}` 
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