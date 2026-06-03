import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const district = await queryOne<{ name: string }>(
      `SELECT name FROM districts WHERE id = $1`,
      [session.districtId]
    );

    const totals = await queryOne<{
      total: string;
      approved: string;
      pending: string;
      draft: string;
      subjects: string;
    }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE status = 'approved')::text AS approved,
         COUNT(*) FILTER (WHERE status = 'submitted')::text AS pending,
         COUNT(*) FILTER (WHERE status = 'draft')::text AS draft,
         COUNT(DISTINCT subject_area) FILTER (WHERE status = 'approved')::text AS subjects
       FROM curriculum_docs WHERE district_id = $1`,
      [session.districtId]
    );

    const userTotals = await queryOne<{ teachers: string; admins: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE role = 'teacher')::text AS teachers,
         COUNT(*) FILTER (WHERE role = 'admin')::text AS admins
       FROM users WHERE district_id = $1`,
      [session.districtId]
    );

    const frameworks = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM district_frameworks WHERE district_id = $1`,
      [session.districtId]
    );

    return NextResponse.json({
      snapshot: {
        districtName: district?.name || '',
        totalUnits: Number(totals?.total || 0),
        approvedUnits: Number(totals?.approved || 0),
        pendingUnits: Number(totals?.pending || 0),
        draftUnits: Number(totals?.draft || 0),
        teacherCount: Number(userTotals?.teachers || 0),
        adminCount: Number(userTotals?.admins || 0),
        subjectsCovered: Number(totals?.subjects || 0),
        framworksEnabled: Number(frameworks?.count || 0),
      },
    });
  } catch (err) {
    console.error('accreditation snapshot error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
