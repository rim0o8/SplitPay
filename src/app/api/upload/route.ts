import { authOptions } from '@/lib/auth.js';
import { uploadImageToStorage } from '@/lib/firebase/storage';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // リクエストボディから画像データを取得
    const { imageData, fileName } = await request.json();
    
    if (!imageData) {
      return NextResponse.json(
        { error: '画像データが必要です' },
        { status: 400 }
      );
    }
    
    // サーバーサイドでセッションを取得
    const session = await getServerSession(authOptions);
    console.log('API upload session:', session);
    
    // 画像をFirebase Storageにアップロード
    const imageUrl = await uploadImageToStorage(imageData, fileName);
    
    return NextResponse.json({
      success: true,
      url: imageUrl
    });
    
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    return NextResponse.json(
      { error: '画像のアップロード中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 