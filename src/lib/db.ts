import { kv } from '@vercel/kv';

// kv が環境変数（KV_REST_API_URL / KV_REST_API_TOKEN）を内部で解決できない
// ローカル開発時など未設定の場合はインメモリにフォールバック

function createMemoryKv() {
  const store = new Map<string, unknown>();
  return {
    async get<T>(key: string) {
      return (store.get(key) as T) ?? null;
    },
    async set(key: string, value: unknown) {
      store.set(key, value);
    },
  };
}

export const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN ? kv : createMemoryKv();
