import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const subject = searchParams.get('subject');
    const grade = searchParams.get('grade');
    const teacherId = searchParams.get('teacher_id');
    const publicOnly = searchParams.get('public') === 'true';

    const db = getDb();
    let query = `
      SELECT d.*, u.name as teacher_name, u.email as teacher_email
      FROM curriculum_docs d
      JOIN users u ON d.teacher_id = u.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (publicOnly) {
      query += ` AND d.status = 'approved'`;
    }

    if (status) {
      query += ` AND d.status = ?`;
      params.push(status);
    }

    if (subject) {
      query += ` AND d.subject_area = ?`;
      params.push(subject);
    }

    if (grade) {
      query += ` AND d.grade = ?`;
      params.push(grade);
    }

    if (teacherId) {
      query += ` AND d.teacher_id = ?`;
      params.push(parseInt(teacherId));
    }

    query += ` ORDER BY d.updated_at DESC`;

    const docs = db.prepare(query).all(...params);
    return NextResponse.json({ docs });
  } catch {
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
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO curriculum_docs (teacher_id, subject_area, course, unit_title, grade, start_date, end_date, unit_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.userId,
      body.subject_area,
      body.course || '',
      body.unit_title,
      body.grade,
      body.start_date || '',
      body.end_date || '',
      body.unit_summary || ''
    );

    // Record history
    db.prepare(`
      INSERT INTO doc_history (doc_id, user_id, action, note)
      VALUES (?, ?, 'created', 'Document created')
    `).run(result.lastInsertRowid, session.userId);

    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
