import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne } from '@/lib/db';
import { createToken, COOKIE_NAME } from '@/lib/auth';
import { User } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { email, password, districtSlug } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    let user: (User & { district_slug: string; district_name: string }) | undefined;

    if (districtSlug) {
      user = await queryOne(
        `SELECT u.*, d.slug AS district_slug, d.name AS district_name
         FROM users u JOIN districts d ON d.id = u.district_id
         WHERE u.email = $1 AND d.slug = $2`,
        [email, districtSlug]
      );
    } else {
      user = await queryOne(
        `SELECT u.*, d.slug AS district_slug, d.name AS district_name
         FROM users u JOIN districts d ON d.id = u.district_id
         WHERE u.email = $1
         ORDER BY u.id ASC LIMIT 1`,
        [email]
      );
    }

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = createToken({
      userId: Number(user.id),
      districtId: Number(user.district_id),
      districtSlug: user.district_slug,
      districtName: user.district_name,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: Number(user.id),
        email: user.email,
        name: user.name,
        role: user.role,
        districtSlug: user.district_slug,
        districtName: user.district_name,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
