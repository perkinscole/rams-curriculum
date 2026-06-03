import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const frameworkId = new URL(request.url).searchParams.get('framework');
    if (!frameworkId) return NextResponse.json({ error: 'framework required' }, { status: 400 });

    const framework = await queryOne(
      `SELECT id, slug, name, subject, grade_band FROM standards_frameworks WHERE id = $1`,
      [frameworkId]
    );
    if (!framework) return NextResponse.json({ error: 'Framework not found' }, { status: 404 });

    const standards = await query(
      `SELECT id, code, description, grade, domain FROM standards
       WHERE framework_id = $1
       ORDER BY grade, code`,
      [frameworkId]
    );

    const coverage = await query(
      `SELECT c.standard_id, c.depth, c.rationale, c.doc_id, c.analyzed_at,
              d.unit_title, d.subject_area, d.grade AS doc_grade,
              u.name AS teacher_name
       FROM doc_standards_coverage c
       JOIN curriculum_docs d ON d.id = c.doc_id
       JOIN users u ON u.id = d.teacher_id
       WHERE c.district_id = $1 AND c.framework_id = $2
       ORDER BY c.analyzed_at DESC`,
      [session.districtId, frameworkId]
    );

    return NextResponse.json({ framework, standards, coverage });
  } catch (err) {
    console.error('coverage GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
