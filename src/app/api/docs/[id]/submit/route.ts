import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const doc = db.prepare('SELECT * FROM curriculum_docs WHERE id = ?').get(parseInt(id)) as { teacher_id: number; status: string } | undefined;

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.teacher_id !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (doc.status !== 'draft' && doc.status !== 'revision_requested') {
      return NextResponse.json({ error: 'Can only submit drafts or revision-requested docs' }, { status: 400 });
    }

    db.prepare("UPDATE curriculum_docs SET status = 'submitted', updated_at = datetime('now') WHERE id = ?").run(parseInt(id));
    db.prepare(`INSERT INTO doc_history (doc_id, user_id, action, note) VALUES (?, ?, 'submitted', 'Submitted for review')`).run(parseInt(id), session.userId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
