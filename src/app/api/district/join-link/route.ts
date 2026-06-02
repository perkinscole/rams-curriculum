import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const token = crypto.randomBytes(12).toString('base64url');
    await query(`UPDATE districts SET join_token = $1 WHERE id = $2`, [token, session.districtId]);

    return NextResponse.json({ joinToken: token });
  } catch (err) {
    console.error('join-link POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await query(`UPDATE districts SET join_token = NULL WHERE id = $1`, [session.districtId]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('join-link DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const row = await queryOne<{ join_token: string | null }>(
      `SELECT join_token FROM districts WHERE id = $1`,
      [session.districtId]
    );
    return NextResponse.json({ joinToken: row?.join_token || null });
  } catch (err) {
    console.error('join-link GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
