import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const db = getDb();

    const doc = db.prepare('SELECT * FROM curriculum_docs WHERE id = ?').get(parseInt(id));
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    db.prepare("UPDATE curriculum_docs SET status = 'approved', updated_at = datetime('now') WHERE id = ?").run(parseInt(id));
    db.prepare(`INSERT INTO doc_history (doc_id, user_id, action, note) VALUES (?, ?, 'approved', ?)`).run(parseInt(id), session.userId, body.note || 'Document approved');

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
