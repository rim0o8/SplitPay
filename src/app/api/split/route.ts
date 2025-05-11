import { createSession } from '@/lib/split-session';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { participants } = await request.json();
    const id = await createSession(participants);
    return NextResponse.json({ id });
  } catch (error) {
    console.error(error);
    return new NextResponse('Error creating session', { status: 500 });
  }
}
