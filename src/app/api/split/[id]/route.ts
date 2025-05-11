import { getSession, updateSession } from '@/lib/split-session';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    await updateSession(id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return new NextResponse('Error updating session', { status: 500 });
  }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession(id);
    if (!session) return new NextResponse('Not found', { status: 404 });
    return NextResponse.json(session);
  } catch (error) {
    console.error(error);
    return new NextResponse('Error', { status: 500 });
  }
}
