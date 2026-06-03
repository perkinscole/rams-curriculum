import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const frameworks = await query(
      `SELECT f.id, f.slug, f.name, f.state, f.subject, f.grade_band, f.description,
              (SELECT COUNT(*) FROM standards s WHERE s.framework_id = f.id) AS standards_count,
              EXISTS (SELECT 1 FROM district_frameworks df WHERE df.district_id = $1 AND df.framework_id = f.id) AS enabled
       FROM standards_frameworks f
       ORDER BY f.state NULLS FIRST, f.subject, f.name`,
      [session.districtId]
    );

    return NextResponse.json({ frameworks });
  } catch (err) {
    console.error('frameworks GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const { frameworkId, enabled } = await request.json();
    if (!frameworkId) return NextResponse.json({ error: 'frameworkId required' }, { status: 400 });

    if (enabled) {
      await query(
        `INSERT INTO district_frameworks (district_id, framework_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [session.districtId, frameworkId]
      );
    } else {
      await query(
        `DELETE FROM district_frameworks WHERE district_id = $1 AND framework_id = $2`,
        [session.districtId, frameworkId]
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('frameworks POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
