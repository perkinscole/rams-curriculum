import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const docId = parseInt(id);
    const body = await request.json();

    const doc = await queryOne<{ district_id: string }>(
      `SELECT district_id FROM curriculum_docs WHERE id = $1`,
      [docId]
    );
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    if (Number(doc.district_id) !== session.districtId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await query(
      `UPDATE curriculum_docs SET status = 'revision_requested', updated_at = now() WHERE id = $1`,
      [docId]
    );
    await query(
      `INSERT INTO doc_history (district_id, doc_id, user_id, action, note)
       VALUES ($1, $2, $3, 'revision_requested', $4)`,
      [session.districtId, docId, session.userId, body.note || 'Revision requested']
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('revision error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
