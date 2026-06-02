import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface InviteInput {
  email?: string;
  name?: string;
  role?: 'teacher' | 'admin';
  department?: string;
}

function generateToken(): string {
  return crypto.randomBytes(18).toString('base64url');
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const invitations = await query(
      `SELECT id, token, email, name, role, department, created_at, accepted_at, expires_at
       FROM invitations
       WHERE district_id = $1
       ORDER BY created_at DESC`,
      [session.districtId]
    );

    return NextResponse.json({ invitations });
  } catch (err) {
    console.error('invitations GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const inputs: InviteInput[] = Array.isArray(body.invites) ? body.invites : [body];

    const origin = new URL(request.url).origin;
    const created: Array<{ id: number; email: string; name: string; joinUrl: string; error?: string }> = [];

    for (const input of inputs) {
      const email = (input.email || '').trim().toLowerCase();
      const name = (input.name || '').trim();
      const role = input.role === 'admin' ? 'admin' : 'teacher';
      const department = (input.department || '').trim();

      if (!email || !name) {
        created.push({ id: 0, email, name, joinUrl: '', error: 'name and email required' });
        continue;
      }

      const existingUser = await queryOne(
        `SELECT 1 AS x FROM users WHERE district_id = $1 AND email = $2`,
        [session.districtId, email]
      );
      if (existingUser) {
        created.push({ id: 0, email, name, joinUrl: '', error: 'user already exists' });
        continue;
      }

      const token = generateToken();
      const row = await queryOne<{ id: string }>(
        `INSERT INTO invitations (district_id, token, email, name, role, department)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [session.districtId, token, email, name, role, department]
      );

      created.push({
        id: Number(row?.id),
        email,
        name,
        joinUrl: `${origin}/invite/${token}`,
      });
    }

    return NextResponse.json({ invitations: created }, { status: 201 });
  } catch (err) {
    console.error('invitations POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
