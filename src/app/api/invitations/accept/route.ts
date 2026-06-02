import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '@/lib/db';
import { createToken, COOKIE_NAME } from '@/lib/auth';

interface InvitationRow {
  id: string;
  district_id: string;
  email: string;
  name: string;
  role: 'teacher' | 'admin';
  department: string;
  accepted_at: string | null;
  expires_at: string;
  district_name: string;
  district_slug: string;
}

async function lookupInvite(token: string): Promise<InvitationRow | undefined> {
  return queryOne<InvitationRow>(
    `SELECT i.id, i.district_id, i.email, i.name, i.role, i.department,
            i.accepted_at, i.expires_at,
            d.name AS district_name, d.slug AS district_slug
     FROM invitations i
     JOIN districts d ON d.id = i.district_id
     WHERE i.token = $1`,
    [token]
  );
}

function reasonInvalid(invite: InvitationRow | undefined): string | null {
  if (!invite) return 'This invitation link is not valid.';
  if (invite.accepted_at) return 'This invitation has already been used.';
  if (new Date(invite.expires_at).getTime() < Date.now()) return 'This invitation has expired.';
  return null;
}

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }
    const invite = await lookupInvite(token);
    const err = reasonInvalid(invite);
    if (err) return NextResponse.json({ error: err }, { status: 410 });

    return NextResponse.json({
      invitation: {
        email: invite!.email,
        name: invite!.name,
        role: invite!.role,
        department: invite!.department,
        districtName: invite!.district_name,
      },
    });
  } catch (err) {
    console.error('invite accept GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const invite = await lookupInvite(token);
    const errReason = reasonInvalid(invite);
    if (errReason) return NextResponse.json({ error: errReason }, { status: 410 });

    const existingUser = await queryOne(
      `SELECT 1 AS x FROM users WHERE district_id = $1 AND email = $2`,
      [invite!.district_id, invite!.email]
    );
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists in this district. Please sign in instead.' },
        { status: 409 }
      );
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userRow = await queryOne<{ id: string }>(
      `INSERT INTO users (district_id, email, password_hash, name, role, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [invite!.district_id, invite!.email, passwordHash, invite!.name, invite!.role, invite!.department]
    );

    await query(`UPDATE invitations SET accepted_at = now() WHERE id = $1`, [invite!.id]);

    const jwt = createToken({
      userId: Number(userRow!.id),
      districtId: Number(invite!.district_id),
      districtSlug: invite!.district_slug,
      districtName: invite!.district_name,
      email: invite!.email,
      name: invite!.name,
      role: invite!.role,
    });

    const response = NextResponse.json({
      user: { id: Number(userRow!.id), email: invite!.email, name: invite!.name, role: invite!.role },
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
    console.error('invite accept POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
