import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const inviteId = parseInt(id);

    const invite = await queryOne<{ district_id: string }>(
      `SELECT district_id FROM invitations WHERE id = $1`,
      [inviteId]
    );
    if (!invite || Number(invite.district_id) !== session.districtId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await query(`DELETE FROM invitations WHERE id = $1`, [inviteId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('invitation DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
