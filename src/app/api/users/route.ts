import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const users = await query(
      `SELECT id, email, name, role, department, created_at
       FROM users WHERE district_id = $1 ORDER BY name ASC`,
      [session.districtId]
    );

    return NextResponse.json({ users });
  } catch (err) {
    console.error('users GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email, name, password, role, department } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Email, name, and password are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    if (role && role !== 'teacher' && role !== 'admin') {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }

    const existing = await queryOne(
      `SELECT 1 AS x FROM users WHERE district_id = $1 AND email = $2`,
      [session.districtId, email]
    );
    if (existing) {
      return NextResponse.json({ error: 'A user with that email already exists in your district.' }, { status: 409 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const inserted = await queryOne<{ id: string }>(
      `INSERT INTO users (district_id, email, password_hash, name, role, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [session.districtId, email, passwordHash, name, role || 'teacher', department || '']
    );

    return NextResponse.json({ id: Number(inserted?.id) }, { status: 201 });
  } catch (err) {
    console.error('users POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
