import { nanoid } from 'nanoid';
import { redis } from './db';

export interface Session {
  id: string;
  participants: { id: string; name: string }[];
  payments: unknown[];
}

export async function createSession(participants: { name: string }[]): Promise<string> {
  const id = nanoid(8);
  const session: Session = {
    id,
    participants: participants.map((p) => ({ id: crypto.randomUUID(), name: p.name.trim() })),
    payments: [],
  };
  await redis.set(`split:${id}`, session);
  return id;
}

export async function getSession(id: string): Promise<Session | null> {
  const data = await redis.get<Session>(`split:${id}`);
  return data ?? null;
}
