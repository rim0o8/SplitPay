import { Config } from '@/utils/config';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { deleteObject, getDownloadURL, getStorage, ref, uploadString } from 'firebase/storage';
import { getServerSession } from 'next-auth/next';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '../auth.js';

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
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

/**
 * Base64形式の画像をFirebase Storageにアップロードする
 * @param base64Data Base64形式の画像データ
 * @param fileName オプションのファイル名
 * @returns アップロードした画像のURL
 */
export const uploadImageToStorage = async (
  base64Data: string,
  fileName?: string
): Promise<string> => {
  try {
    // まずNextAuthのセッションからUIDを取得
    const session = await getServerSession(authOptions);
    console.log('session:', session);
    
    // セッションのUIDがある場合はそれを使用し、なければFirebaseから取得
    let userId = session?.uid || '';
    console.log('userId from session:', userId);

    // セッションからUIDが取得できない場合はFirebaseの認証状態を確認
    if (!userId) {
      const currentUser = auth.currentUser;
      userId = currentUser ? currentUser.uid : 'anonymous';
      console.log('userId after fallback:', userId);
    }

    // 一意のファイル名を生成
    const uniqueFileName = fileName 
      ? `${userId}/${uuidv4()}-${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}` 
      : `${userId}/${uuidv4()}.jpg`;
    
    // Storageの参照を作成
    const imageRef = ref(storage, `chat-images/${uniqueFileName}`);
    
    // Base64データからdataURLの部分だけを抽出
    const base64Content = base64Data.split(',')[1] || base64Data;
    
    // 画像をアップロード
    await uploadString(imageRef, base64Content, 'base64');
    
    // アップロードした画像のURLを取得
    const downloadURL = await getDownloadURL(imageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    throw new Error('画像のアップロードに失敗しました');
  }
};

/**
 * Firebase Storageから画像を削除する
 * @param imageUrl 削除する画像のURL
 */
export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    // URLからStorage参照を作成
    const imageRef = ref(storage, imageUrl);
    
    // 画像を削除
    await deleteObject(imageRef);
  } catch (error) {
    console.error('画像削除エラー:', error);
    throw new Error('画像の削除に失敗しました');
  }
}; 