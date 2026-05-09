import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const docId = parseInt(id);

    const session = await getSession();

    const doc = await queryOne(
      `SELECT d.*, u.name AS teacher_name, u.email AS teacher_email
       FROM curriculum_docs d
       JOIN users u ON d.teacher_id = u.id
       WHERE d.id = $1`,
      [docId]
    ) as { district_id: string; status: string } | undefined;

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Approved docs are publicly viewable within their district; others require an authenticated user from that district.
    if (doc.status !== 'approved') {
      if (!session || Number(session.districtId) !== Number(doc.district_id)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    return NextResponse.json({ doc });
  } catch (err) {
    console.error('doc GET error:', err);
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
    const docId = parseInt(id);
    const body = await request.json();

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
    if (doc.status === 'approved' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Cannot edit approved documents' }, { status: 400 });
    }

    const allowedFields = [
      'subject_area', 'course', 'unit_title', 'grade', 'start_date', 'end_date',
      'unit_summary', 'stage1', 'stage2', 'stage3',
      'stage1_complete', 'stage2_complete', 'stage3_complete',
    ];

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        const isJson = ['stage1', 'stage2', 'stage3'].includes(field);
        const isBool = field.endsWith('_complete');
        if (isJson) {
          setClauses.push(`${field} = $${i++}::jsonb`);
          values.push(typeof body[field] === 'string' ? body[field] : JSON.stringify(body[field]));
        } else if (isBool) {
          setClauses.push(`${field} = $${i++}`);
          values.push(Boolean(body[field]));
        } else {
          setClauses.push(`${field} = $${i++}`);
          values.push(body[field]);
        }
      }
    }

    if (setClauses.length > 0) {
      setClauses.push(`updated_at = now()`);
      values.push(docId);
      await query(`UPDATE curriculum_docs SET ${setClauses.join(', ')} WHERE id = $${i}`, values);

      await query(
        `INSERT INTO doc_history (district_id, doc_id, user_id, action, note)
         VALUES ($1, $2, $3, 'edited', $4)`,
        [session.districtId, docId, session.userId, body._note || 'Document updated']
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('doc PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
