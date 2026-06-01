import { NextResponse } from 'next/server';
import { queryOne, DEFAULT_SUBJECTS, DEFAULT_GRADES } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { District } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    let district: District | undefined;

    if (slug) {
      district = await queryOne<District>(
        `SELECT id, slug, name, subjects, grades, created_at FROM districts WHERE slug = $1`,
        [slug]
      );
    } else {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ district: null }, { status: 401 });
      }
      district = await queryOne<District>(
        `SELECT id, slug, name, subjects, grades, created_at FROM districts WHERE id = $1`,
        [session.districtId]
      );
    }

    if (!district) {
      return NextResponse.json({ district: null }, { status: 404 });
    }

    return NextResponse.json({
      district: {
        ...district,
        subjects: district.subjects?.length ? district.subjects : DEFAULT_SUBJECTS,
        grades: district.grades?.length ? district.grades : DEFAULT_GRADES,
      },
    });
  } catch (err) {
    console.error('District fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (typeof body.name === 'string' && body.name.trim()) {
      fields.push(`name = $${i++}`);
      values.push(body.name.trim());
    }
    if (Array.isArray(body.subjects)) {
      fields.push(`subjects = $${i++}::jsonb`);
      values.push(JSON.stringify(body.subjects.map(String)));
    }
    if (Array.isArray(body.grades)) {
      fields.push(`grades = $${i++}::jsonb`);
      values.push(JSON.stringify(body.grades.map(String)));
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: true });
    }

    values.push(session.districtId);
    await queryOne(
      `UPDATE districts SET ${fields.join(', ')} WHERE id = $${i} RETURNING id`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('District update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
