import { nanoid } from 'nanoid';
import { redis } from './db';

const log = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[split-session]', ...args);
  }
};

export interface Payment {
  id: string;
  payerId: string;
  amount: string;
  description: string;
  participantIds: string[];
  /** Unix timestamp (ms) when the payment was recorded */
  createdAt?: number;
}

export interface Session {
  id: string;
  /** Optional title set by user */
  title?: string;
  /** Unix timestamp (ms) when the session was created */
  createdAt?: number;
  participants: { id: string; name: string }[];
  payments: Payment[];
  /** Keys of settlements that have been marked as done (for UI). */
  doneSettlements?: string[];
  /** Whether all settlements are cleared. */
  cleared?: boolean;
}

export async function createSession(
  participants: { name: string }[],
  title?: string
): Promise<string> {
  const id = nanoid(8);
  const session: Session = {
    id,
    title,
    createdAt: Date.now(),
    participants: participants.map((p) => ({ id: crypto.randomUUID(), name: p.name.trim() })),
    payments: [],
  };
  const ttlSeconds = 60 * 60 * 24 * 180; // 180 days
  await redis.set(`split:${id}`, session, { ex: ttlSeconds });
  log('created', id, 'participants', session.participants.length);
  return id;
}

export async function getSession(id: string): Promise<Session | null> {
  log('fetch', id);
  const data = await redis.get<Session>(`split:${id}`);
  log('result', data ? 'hit' : 'miss');
  return data ?? null;
}

export async function updateSession(id: string, data: Partial<Omit<Session, 'id'>>): Promise<void> {
  log('update', id);
  const key = `split:${id}`;
  const current = await redis.get<Session>(key);
  if (!current) return;
  const updated: Session = { ...current, ...data } as Session;
  const ttlSeconds = 60 * 60 * 24 * 180;
  await redis.set(key, updated, { ex: ttlSeconds });
}
