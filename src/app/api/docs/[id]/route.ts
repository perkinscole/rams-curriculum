import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const doc = db.prepare(`
      SELECT d.*, u.name as teacher_name, u.email as teacher_email
      FROM curriculum_docs d
      JOIN users u ON d.teacher_id = u.id
      WHERE d.id = ?
    `).get(parseInt(id));

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ doc });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const doc = db.prepare('SELECT * FROM curriculum_docs WHERE id = ?').get(parseInt(id)) as { teacher_id: number; status: string } | undefined;
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Only the owning teacher or admin can edit
    if (doc.teacher_id !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Don't allow editing approved docs (unless admin)
    if (doc.status === 'approved' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Cannot edit approved documents' }, { status: 400 });
    }

    const fields: string[] = [];
    const values: (string | number)[] = [];

    const allowedFields = [
      'subject_area', 'course', 'unit_title', 'grade', 'start_date', 'end_date',
      'unit_summary', 'stage1', 'stage2', 'stage3',
      'stage1_complete', 'stage2_complete', 'stage3_complete'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(typeof body[field] === 'object' ? JSON.stringify(body[field]) : body[field]);
      }
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      values.push(parseInt(id));
      db.prepare(`UPDATE curriculum_docs SET ${fields.join(', ')} WHERE id = ?`).run(...values);

      db.prepare(`
        INSERT INTO doc_history (doc_id, user_id, action, note)
        VALUES (?, ?, 'edited', ?)
      `).run(parseInt(id), session.userId, body._note || 'Document updated');
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
