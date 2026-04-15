import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const history = db.prepare(`
      SELECT h.*, u.name as user_name
      FROM doc_history h
      JOIN users u ON h.user_id = u.id
      WHERE h.doc_id = ?
      ORDER BY h.created_at DESC
    `).all(parseInt(id));

    return NextResponse.json({ history });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
