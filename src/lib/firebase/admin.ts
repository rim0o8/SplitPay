import { Config } from '@/utils/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Firebase Admin SDKの初期化
function initializeAdminApp() {
  try {
    // 既に初期化されているアプリがあれば、それを使用
    if (getApps().length > 0) {
      const app = getApps()[0];
      return { app, auth: getAuth(app) };
    }
    
    // 新しいアプリを初期化
    // 本番環境ではサービスアカウントJSONを環境変数から取得するかVault等から安全に取得すること
    // 開発環境ではサービスアカウントを直接使用することもあります
    const serviceAccount = {
      projectId: Config.AUTH_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    
    // サービスアカウント情報が揃っているか確認
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('Firebase Adminのサービスアカウント情報が不足しています');
    }
    
    // Adminアプリの初期化
    const app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: Config.AUTH_FIREBASE_STORAGE_BUCKET,
    });
    
    return { app, auth: getAuth(app) };
  } catch (error) {
    console.error('Firebase Admin初期化エラー:', error);
    throw error;
  }
}

// Firebase Adminアプリと認証モジュールをエクスポート
const { app, auth } = initializeAdminApp();

export { app, auth };
