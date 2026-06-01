import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne, DEFAULT_SUBJECTS, DEFAULT_GRADES } from '@/lib/db';
import { createToken, COOKIE_NAME } from '@/lib/auth';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function POST(request: Request) {
  try {
    const { districtName, adminName, email, password } = await request.json();

    if (!districtName || !adminName || !email || !password) {
      return NextResponse.json(
        { error: 'District name, your name, email, and password are all required.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const baseSlug = slugify(districtName) || 'district';
    let slug = baseSlug;
    let suffix = 1;
    while (await queryOne(`SELECT 1 AS x FROM districts WHERE slug = $1`, [slug])) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const districtRow = await queryOne<{
      id: string;
      slug: string;
      name: string;
    }>(
      `INSERT INTO districts (slug, name, subjects, grades)
       VALUES ($1, $2, $3::jsonb, $4::jsonb)
       RETURNING id, slug, name`,
      [slug, districtName, JSON.stringify(DEFAULT_SUBJECTS), JSON.stringify(DEFAULT_GRADES)]
    );

    if (!districtRow) {
      return NextResponse.json({ error: 'Could not create district.' }, { status: 500 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userRow = await queryOne<{ id: string }>(
      `INSERT INTO users (district_id, email, password_hash, name, role, department)
       VALUES ($1, $2, $3, $4, 'admin', 'Curriculum Office')
       RETURNING id`,
      [districtRow.id, email, passwordHash, adminName]
    );

    if (!userRow) {
      await query(`DELETE FROM districts WHERE id = $1`, [districtRow.id]);
      return NextResponse.json({ error: 'Could not create admin user.' }, { status: 500 });
    }

    const token = createToken({
      userId: Number(userRow.id),
      districtId: Number(districtRow.id),
      districtSlug: districtRow.slug,
      districtName: districtRow.name,
      email,
      name: adminName,
      role: 'admin',
    });

    const response = NextResponse.json({
      district: { slug: districtRow.slug, name: districtRow.name },
      user: { id: Number(userRow.id), email, name: adminName, role: 'admin' },
    }, { status: 201 });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (err) {
    const message = (err as { code?: string; message?: string }).code === '23505'
      ? 'A district with that name or an account with that email already exists.'
      : 'Internal server error';
    console.error('Signup error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
