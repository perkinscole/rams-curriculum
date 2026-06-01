import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const docId = parseInt(id);

    const doc = await queryOne<{ teacher_id: string; status: string; district_id: string }>(
      `SELECT teacher_id, status, district_id FROM curriculum_docs WHERE id = $1`,
      [docId]
    );

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    if (Number(doc.district_id) !== session.districtId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (Number(doc.teacher_id) !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (doc.status !== 'draft' && doc.status !== 'revision_requested') {
      return NextResponse.json({ error: 'Can only submit drafts or revision-requested docs' }, { status: 400 });
    }

    await query(
      `UPDATE curriculum_docs SET status = 'submitted', updated_at = now() WHERE id = $1`,
      [docId]
    );
    await query(
      `INSERT INTO doc_history (district_id, doc_id, user_id, action, note)
       VALUES ($1, $2, $3, 'submitted', 'Submitted for review')`,
      [session.districtId, docId, session.userId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('submit error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
