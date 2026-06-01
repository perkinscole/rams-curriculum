import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const docId = parseInt(id);

    const history = await query(
      `SELECT h.*, u.name AS user_name
       FROM doc_history h JOIN users u ON h.user_id = u.id
       WHERE h.doc_id = $1 AND h.district_id = $2
       ORDER BY h.created_at DESC`,
      [docId, session.districtId]
    );

    return NextResponse.json({ history });
  } catch (err) {
    console.error('history GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
