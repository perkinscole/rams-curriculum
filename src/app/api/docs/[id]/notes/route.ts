import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const docId = parseInt(id);

    const notes = await query(
      `SELECT n.*, u.name AS user_name, u.role AS user_role
       FROM notes n JOIN users u ON n.user_id = u.id
       WHERE n.doc_id = $1 AND n.district_id = $2
       ORDER BY n.created_at DESC`,
      [docId, session.districtId]
    );

    return NextResponse.json({ notes });
  } catch (err) {
    console.error('notes GET error:', err);
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
    const docId = parseInt(id);
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    const doc = await queryOne<{ district_id: string }>(
      `SELECT district_id FROM curriculum_docs WHERE id = $1`,
      [docId]
    );
    if (!doc || Number(doc.district_id) !== session.districtId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await query(
      `INSERT INTO notes (district_id, doc_id, user_id, content) VALUES ($1, $2, $3, $4)`,
      [session.districtId, docId, session.userId, content.trim()]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('notes POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
