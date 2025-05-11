import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import { Config } from '@/utils/config';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';

// リフレッシュリクエストのキャッシュ用
const tokenRefreshCache = new Map<string, Promise<JWT>>();

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

/**
 * JWTトークンをリフレッシュする関数
 * @param token リフレッシュするトークン
 * @returns 更新されたトークン
 */
async function refreshJWTToken(token: JWT): Promise<JWT> {
  console.log('トークンリフレッシュを開始します', {
    hasRefreshToken: !!token.refreshToken,
    expiresAt: token.expiresAt,
    now: Math.floor(Date.now() / 1000),
  });

  try {
    if (!token.refreshToken) {
      console.error('リフレッシュトークンが見つかりません');
      return token;
    }

    // 既にこのリフレッシュトークンでリクエスト中の場合は、そのプロミスを返す
    const cacheKey = token.refreshToken;
    if (tokenRefreshCache.has(cacheKey)) {
      console.log('キャッシュされたリフレッシュリクエストを使用します');
      const cachedPromise = tokenRefreshCache.get(cacheKey);
      if (cachedPromise) {
        return cachedPromise;
      }
    }

    // 新しいリフレッシュリクエストを作成し、キャッシュに保存
    const refreshPromise = (async () => {
      try {
        // Firebaseトークンをリフレッシュするためのエンドポイントを呼び出す
        const response = await fetch(
          `https://securetoken.googleapis.com/v1/token?key=${Config.AUTH_FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=refresh_token&refresh_token=${token.refreshToken}`,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            `トークンのリフレッシュに失敗しました: ${data.error?.message || JSON.stringify(data)}`
          );
        }

        if (!data.access_token || !data.id_token) {
          console.error('リフレッシュレスポンスにトークンがありません', data);
          throw new Error('リフレッシュレスポンスが不完全です');
        }

        const newExpiresAt = Math.floor(Date.now() / 1000) + Number(data.expires_in);

        console.log('トークンのリフレッシュに成功しました', {
          newExpiresIn: data.expires_in,
          newExpiresAt: newExpiresAt,
          hasAccessToken: !!data.access_token,
          hasIdToken: !!data.id_token,
          hasRefreshToken: !!data.refresh_token,
        });

        const refreshedToken: JWT = {
          ...token,
          accessToken: data.access_token,
          idToken: data.id_token,
          expiresAt: newExpiresAt,
        };

        // リフレッシュトークンも更新された場合は保存
        if (data.refresh_token) {
          refreshedToken.refreshToken = data.refresh_token;
          console.log('リフレッシュトークンも更新されました');
        }

        return refreshedToken;
      } catch (error) {
        console.error('トークンのリフレッシュ中にエラーが発生しました:', error);
        // エラーが発生した場合は元のトークンを返す
        return token;
      } finally {
        // リクエスト完了後、一定時間後にキャッシュから削除（再リクエスト防止のため少し待つ）
        setTimeout(() => {
          tokenRefreshCache.delete(cacheKey);
        }, 5000);
      }
    })();

    // キャッシュに保存
    tokenRefreshCache.set(cacheKey, refreshPromise);
    return refreshPromise;
  } catch (error) {
    console.error('トークンのリフレッシュ中に予期せぬエラーが発生しました:', error);
    return token;
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: Config.GOOGLE_CLIENT_ID as string,
      clientSecret: Config.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          redirect_uri: Config.AUTH_REDIRECT_URI as string,
        },
      },
    }),
    CredentialsProvider({
      name: 'email',
      credentials: {
        email: { label: 'e-mail', type: 'email', required: true },
        password: { label: 'password', type: 'password', required: true },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          const userToken = await user.user.getIdTokenResult();

          if (user) {
            const email = user.user.email;
            if (!email) throw new Error('Email is required but was not provided.');

            return {
              id: user.user.uid,
              uid: user.user.uid,
              accessToken: userToken.token,
              idToken: userToken.token,
              refreshToken: user.user.refreshToken,
              expiresAt: userToken.expirationTime
                ? new Date(userToken.expirationTime).getTime() / 1000
                : undefined,
              email: email,
            };
          }
        } catch (error) {
          console.error('Error authorizing user:', error);
          return null;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      try {
        if (account?.provider === 'google') {
          const credential = GoogleAuthProvider.credential(account.id_token);
          const result = await signInWithCredential(auth, credential);
          return true;
        }
        if (account?.provider === 'credentials') {
          return true;
        }
        return true;
      } catch (error) {
        console.error('Error signing in:', error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async jwt({ token, trigger, session, user, account }) {
      // ユーザーログイン時の処理
      if (user) {
        console.log('JWT: ユーザーログイン情報を設定します');
        token.accessToken = user.accessToken;
        token.idToken = user.idToken;
        token.refreshToken = user.refreshToken;
        token.expiresAt = user.expiresAt;
        token.email = user.email;
        token.uid = user.uid;
      }

      // OAuth認証時の処理
      if (account?.access_token) {
        console.log('JWT: OAuth認証情報を設定します');
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.expiresAt = account.expires_at;
        token.refreshToken = account.refresh_token;
        token.email = account.email;

        // GoogleProviderの場合、Firebaseから認証情報を取得してuidを設定
        if (account.provider === 'google' && account.id_token) {
          try {
            const credential = GoogleAuthProvider.credential(account.id_token);
            const result = await signInWithCredential(auth, credential);
            token.uid = result.user.uid;
          } catch (error) {
            console.error('Firebase認証情報の取得に失敗しました:', error);
          }
        }
      }

      const now = Math.floor(Date.now() / 1000);
      // リフレッシュ判断のためのバッファ時間（1分）
      const refreshBuffer = 60;

      // トークンの有効期限をチェック
      const isExpired =
        token.expiresAt && typeof token.expiresAt === 'number' && token.expiresAt < now;
      // バッファ時間内に有効期限が切れる場合もリフレッシュ
      const isAlmostExpired =
        token.expiresAt &&
        typeof token.expiresAt === 'number' &&
        token.expiresAt < now + refreshBuffer;

      // トークンが期限切れか、期限切れが近い場合にリフレッシュを試みる
      if (isExpired || isAlmostExpired) {
        console.log(
          `トークンの有効期限が${isExpired ? '切れている' : '近い'}ため、リフレッシュを試みます`
        );

        if (!token.refreshToken) {
          console.warn('リフレッシュトークンがないため、リフレッシュできません');
          return token;
        }

        try {
          // リフレッシュ処理を実行
          const refreshedToken = await refreshJWTToken(token);

          // リフレッシュが成功したかどうかを確認（expiresAtが更新されているかで判断）
          const refreshSuccess = refreshedToken.expiresAt !== token.expiresAt;

          console.log('トークン更新結果', {
            oldExpiresAt: token.expiresAt,
            newExpiresAt: refreshedToken.expiresAt,
            success: refreshSuccess,
          });

          if (refreshSuccess) {
            return refreshedToken;
          }
          console.warn(
            'トークンのリフレッシュに失敗した可能性があります（有効期限が更新されていません）'
          );
        } catch (error) {
          console.error('トークンリフレッシュ処理中にエラーが発生しました:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      session.refreshToken = token.refreshToken;
      session.expiresAt = token.expiresAt;
      session.email = token.email;
      session.uid = token.uid;

      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 90 * 24 * 60 * 60, // 90日（3ヶ月）
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    newUser: '/auth/signup',
  },
  jwt: {
    maxAge: 90 * 24 * 60 * 60, // 90日（3ヶ月）
  },
  secret: Config.NEXTAUTH_SECRET as string,
  logger: {
    error(code, metadata) {
      console.error(code, metadata);
    },
    warn(code) {
      console.warn(code);
    },
  },
};

export { authOptions };

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    email?: string;
    uid?: string;
  }

  interface User {
    id: string;
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    email?: string;
    uid?: string;
  }

  interface Account {
    email?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    email?: string;
    uid?: string;
  }
}
