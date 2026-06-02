import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { createToken, COOKIE_NAME } from '@/lib/auth';

interface DistrictRow {
  id: string;
  slug: string;
  name: string;
}

async function lookupByToken(token: string): Promise<DistrictRow | undefined> {
  return queryOne<DistrictRow>(
    `SELECT id, slug, name FROM districts WHERE join_token = $1`,
    [token]
  );
}

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    const district = await lookupByToken(token);
    if (!district) {
      return NextResponse.json({ error: 'This join link is not valid or has been disabled.' }, { status: 410 });
    }

    return NextResponse.json({ district: { name: district.name, slug: district.slug } });
  } catch (err) {
    console.error('join GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { token, name, email, password, department } = await request.json();
    if (!token || !name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const district = await lookupByToken(token);
    if (!district) {
      return NextResponse.json({ error: 'This join link is not valid or has been disabled.' }, { status: 410 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await queryOne(
      `SELECT 1 AS x FROM users WHERE district_id = $1 AND email = $2`,
      [district.id, normalizedEmail]
    );
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists in this district. Please sign in instead.' },
        { status: 409 }
      );
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userRow = await queryOne<{ id: string }>(
      `INSERT INTO users (district_id, email, password_hash, name, role, department)
       VALUES ($1, $2, $3, $4, 'teacher', $5)
       RETURNING id`,
      [district.id, normalizedEmail, passwordHash, name.trim(), (department || '').trim()]
    );

    const jwt = createToken({
      userId: Number(userRow!.id),
      districtId: Number(district.id),
      districtSlug: district.slug,
      districtName: district.name,
      email: normalizedEmail,
      name: name.trim(),
      role: 'teacher',
    });

    const response = NextResponse.json({
      user: { id: Number(userRow!.id), email: normalizedEmail, name: name.trim(), role: 'teacher' },
    });

    response.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('join POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
