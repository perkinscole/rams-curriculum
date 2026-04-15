import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const notes = db.prepare(`
      SELECT n.*, u.name as user_name, u.role as user_role
      FROM notes n
      JOIN users u ON n.user_id = u.id
      WHERE n.doc_id = ?
      ORDER BY n.created_at DESC
    `).all(parseInt(id));

    return NextResponse.json({ notes });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('INSERT INTO notes (doc_id, user_id, content) VALUES (?, ?, ?)').run(parseInt(id), session.userId, content.trim());

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
