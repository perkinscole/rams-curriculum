import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const subject = searchParams.get('subject');
    const grade = searchParams.get('grade');
    const teacherId = searchParams.get('teacher_id');
    const publicOnly = searchParams.get('public') === 'true';
    const districtSlug = searchParams.get('district');

    let districtId: number | undefined;

    if (publicOnly) {
      if (!districtSlug) {
        return NextResponse.json({ error: 'district query param required for public listing' }, { status: 400 });
      }
      const d = await queryOne<{ id: string }>(`SELECT id FROM districts WHERE slug = $1`, [districtSlug]);
      if (!d) return NextResponse.json({ docs: [] });
      districtId = Number(d.id);
    } else {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      districtId = session.districtId;
    }

    const params: unknown[] = [districtId];
    let sql = `
      SELECT d.*, u.name AS teacher_name, u.email AS teacher_email
      FROM curriculum_docs d
      JOIN users u ON d.teacher_id = u.id
      WHERE d.district_id = $1
    `;
    let i = 2;

    if (publicOnly) {
      sql += ` AND d.status = 'approved'`;
    }
    if (status) {
      sql += ` AND d.status = $${i++}`;
      params.push(status);
    }
    if (subject) {
      sql += ` AND d.subject_area = $${i++}`;
      params.push(subject);
    }
    if (grade) {
      sql += ` AND d.grade = $${i++}`;
      params.push(grade);
    }
    if (teacherId) {
      sql += ` AND d.teacher_id = $${i++}`;
      params.push(parseInt(teacherId));
    }

    sql += ` ORDER BY d.updated_at DESC`;

    const docs = await query(sql, params);
    return NextResponse.json({ docs });
  } catch (err) {
    console.error('docs GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const inserted = await queryOne<{ id: string }>(
      `INSERT INTO curriculum_docs
        (district_id, teacher_id, subject_area, course, unit_title, grade, start_date, end_date, unit_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        session.districtId,
        session.userId,
        body.subject_area,
        body.course || '',
        body.unit_title,
        body.grade,
        body.start_date || '',
        body.end_date || '',
        body.unit_summary || '',
      ]
    );

    if (!inserted) {
      return NextResponse.json({ error: 'Could not create document' }, { status: 500 });
    }

    await query(
      `INSERT INTO doc_history (district_id, doc_id, user_id, action, note)
       VALUES ($1, $2, $3, 'created', 'Document created')`,
      [session.districtId, inserted.id, session.userId]
    );

    return NextResponse.json({ id: Number(inserted.id) }, { status: 201 });
  } catch (err) {
    console.error('docs POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
