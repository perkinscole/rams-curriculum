import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { CurriculumDoc, parseStage, Stage1, Stage2 } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { subjects, grade, districtSlug } = await request.json();
    const session = await getSession();

    let districtId: number;
    let districtName: string;

    if (session) {
      districtId = session.districtId;
      districtName = session.districtName;
    } else if (districtSlug) {
      const d = await queryOne<{ id: string; name: string }>(
        `SELECT id, name FROM districts WHERE slug = $1`,
        [districtSlug]
      );
      if (!d) return NextResponse.json({ connections: [] });
      districtId = Number(d.id);
      districtName = d.name;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params: unknown[] = [districtId];
    let sql = `
      SELECT d.*, u.name AS teacher_name
      FROM curriculum_docs d JOIN users u ON d.teacher_id = u.id
      WHERE d.district_id = $1 AND d.status = 'approved'
    `;
    let i = 2;

    if (grade) {
      sql += ` AND d.grade = $${i++}`;
      params.push(grade);
    }

    if (subjects && subjects.length > 0) {
      const placeholders = subjects.map(() => `$${i++}`).join(',');
      sql += ` AND d.subject_area IN (${placeholders})`;
      params.push(...subjects);
    }

    const docs = await query<CurriculumDoc>(sql, params);

    if (docs.length < 2) {
      return NextResponse.json({
        connections: [],
        message: 'Need at least 2 approved documents across different subjects to find connections.',
      });
    }

    const docSummaries = docs.map((doc) => {
      const s1 = parseStage<Stage1>(doc.stage1, {
        learning_standards: '', vog_outcomes: '', transfer: '', enduring_understandings: '',
        essential_questions: '', knowledge: '', skills: '',
      });
      const s2 = parseStage<Stage2>(doc.stage2, {
        transfer_tasks: '', formative_assessments: '', summative_assessments: '', other_evidence: '',
      });
      return {
        id: doc.id,
        subject: doc.subject_area,
        unit: doc.unit_title,
        grade: doc.grade,
        teacher: doc.teacher_name,
        timing: `${doc.start_date} to ${doc.end_date}`,
        summary: doc.unit_summary,
        essential_questions: s1.essential_questions || '',
        enduring_understandings: s1.enduring_understandings || '',
        knowledge: s1.knowledge || '',
        skills: s1.skills || '',
        transfer: s1.transfer || '',
        assessments: s2.transfer_tasks || '',
      };
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        connections: [],
        message: 'AI analysis not configured. Set ANTHROPIC_API_KEY in .env.local to enable curriculum connections.',
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `You are a curriculum specialist analyzing UBD (Understanding by Design) curriculum documents for ${districtName}. Find interdisciplinary connections between these curriculum units.

For each connection found, provide:
1. Which subjects/units are connected
2. The specific overlapping theme, skill, or concept
3. How teachers could collaborate
4. Whether the timing aligns for co-teaching opportunities

Curriculum Documents:
${JSON.stringify(docSummaries, null, 2)}

Respond in JSON format:
{
  "connections": [
    {
      "subjects": ["Subject 1", "Subject 2"],
      "units": ["Unit Title 1", "Unit Title 2"],
      "doc_ids": [1, 2],
      "theme": "Brief description of the connection",
      "details": "Detailed explanation of the interdisciplinary opportunity",
      "collaboration_idea": "Specific suggestion for teacher collaboration",
      "timing_aligned": true
    }
  ],
  "summary": "Overall summary of interdisciplinary opportunities"
}`,
        }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        connections: [],
        message: 'AI analysis temporarily unavailable. Please try again later.',
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.content[0]?.text || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    }

    return NextResponse.json({ connections: [], message: 'Could not parse AI response.' });
  } catch (err) {
    console.error('connections error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
