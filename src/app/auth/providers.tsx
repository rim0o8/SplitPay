'use client';

import { Config } from '@/utils/config';
import { getApps, initializeApp } from 'firebase/app';
import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

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
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export function AuthProviders({
  children,
}: {
  children: ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
} 