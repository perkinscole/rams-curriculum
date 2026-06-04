import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { CurriculumDoc, parseStage, Stage1 } from '@/lib/types';

const GRADE_ORDER = ['Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

interface DocRow extends CurriculumDoc {
  teacher_name: string;
}

function docContext(doc: DocRow): string {
  const s1 = parseStage<Stage1>(doc.stage1, {
    learning_standards: '', vog_outcomes: '', transfer: '', enduring_understandings: '',
    essential_questions: '', knowledge: '', skills: '',
  });
  return `UNIT: ${doc.unit_title} (Grade ${doc.grade})
SUMMARY: ${doc.unit_summary || '(none)'}
STANDARDS: ${s1.learning_standards || '(none listed)'}
ENDURING UNDERSTANDINGS: ${s1.enduring_understandings || '(none)'}
ESSENTIAL QUESTIONS: ${s1.essential_questions || '(none)'}
KNOWLEDGE: ${s1.knowledge || '(none)'}
SKILLS: ${s1.skills || '(none)'}`;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const rows = await query<{ subject_area: string; grade: string; count: string }>(
      `SELECT subject_area, grade, COUNT(*)::text AS count
       FROM curriculum_docs
       WHERE district_id = $1 AND status = 'approved'
       GROUP BY subject_area, grade`,
      [session.districtId]
    );

    const bySubject: Record<string, Map<string, number>> = {};
    for (const r of rows) {
      if (!bySubject[r.subject_area]) bySubject[r.subject_area] = new Map();
      bySubject[r.subject_area].set(r.grade, Number(r.count));
    }

    const pairs: Array<{ subject: string; lowerGrade: string; higherGrade: string; lowerCount: number; higherCount: number }> = [];
    for (const subject of Object.keys(bySubject).sort()) {
      const gradesWithDocs = Array.from(bySubject[subject].keys());
      const orderedGrades = GRADE_ORDER.filter(g => gradesWithDocs.includes(g));
      for (let i = 0; i < orderedGrades.length - 1; i++) {
        const lo = orderedGrades[i];
        const hi = orderedGrades[i + 1];
        const loIdx = GRADE_ORDER.indexOf(lo);
        const hiIdx = GRADE_ORDER.indexOf(hi);
        if (hiIdx - loIdx === 1) {
          pairs.push({
            subject, lowerGrade: lo, higherGrade: hi,
            lowerCount: bySubject[subject].get(lo) || 0,
            higherCount: bySubject[subject].get(hi) || 0,
          });
        }
      }
    }

    return NextResponse.json({ pairs });
  } catch (err) {
    console.error('alignment GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI analysis requires ANTHROPIC_API_KEY.' }, { status: 400 });
    }

    const { subject, lowerGrade, higherGrade } = await request.json();
    if (!subject || !lowerGrade || !higherGrade) {
      return NextResponse.json({ error: 'subject, lowerGrade, and higherGrade are required.' }, { status: 400 });
    }

    const lowerDocs = await query<DocRow>(
      `SELECT d.*, u.name AS teacher_name
       FROM curriculum_docs d JOIN users u ON d.teacher_id = u.id
       WHERE d.district_id = $1 AND d.status = 'approved' AND d.subject_area = $2 AND d.grade = $3`,
      [session.districtId, subject, lowerGrade]
    );
    const higherDocs = await query<DocRow>(
      `SELECT d.*, u.name AS teacher_name
       FROM curriculum_docs d JOIN users u ON d.teacher_id = u.id
       WHERE d.district_id = $1 AND d.status = 'approved' AND d.subject_area = $2 AND d.grade = $3`,
      [session.districtId, subject, higherGrade]
    );

    if (lowerDocs.length === 0 || higherDocs.length === 0) {
      return NextResponse.json({
        error: `Need approved units in both Grade ${lowerGrade} and Grade ${higherGrade} ${subject} to analyze.`,
      }, { status: 400 });
    }

    const prompt = `You are a curriculum specialist analyzing vertical alignment between two adjacent grade levels in ${subject}. Your audience is a district curriculum coordinator preparing for board review.

LOWER GRADE (Grade ${lowerGrade}) — ${lowerDocs.length} approved unit${lowerDocs.length !== 1 ? 's' : ''}:
${lowerDocs.map(docContext).join('\n\n---\n\n')}

HIGHER GRADE (Grade ${higherGrade}) — ${higherDocs.length} approved unit${higherDocs.length !== 1 ? 's' : ''}:
${higherDocs.map(docContext).join('\n\n---\n\n')}

Identify three things, in this order of importance:

1. GAPS — topics, skills, or concepts the HIGHER grade depends on but the LOWER grade does not adequately establish. These are the most actionable findings because they predict where students will struggle.

2. REDUNDANCIES — topics taught at substantially the same depth in BOTH grades with no clear advancement. These cost instructional time.

3. SMOOTH HANDOFFS — topics where the LOWER grade clearly prepares students for the HIGHER grade. Worth naming these so the curriculum office can recognize what is working.

Be specific. Cite unit titles. Limit each list to the 3-5 most important findings. If a category has nothing notable, return an empty array.

Respond with ONLY valid JSON in this exact format:
{
  "summary": "One paragraph (3-5 sentences) executive summary of the vertical alignment between these grades, suitable to read aloud at a faculty meeting.",
  "gaps": [
    {
      "topic": "Short topic name",
      "introduced_in": "Unit title where it shows up in the higher grade",
      "missing_in_lower": "What the lower grade is missing, in plain language",
      "recommendation": "One sentence: what to add or strengthen in the lower grade"
    }
  ],
  "redundancies": [
    {
      "topic": "Short topic name",
      "explanation": "Where it appears in both grades and why that's a redundancy",
      "recommendation": "One sentence: how to differentiate, deepen, or drop"
    }
  ],
  "smooth_handoffs": [
    {
      "topic": "Short topic name",
      "lower_unit": "Unit title in lower grade",
      "higher_unit": "Unit title in higher grade",
      "explanation": "One sentence on how the lower sets up the higher"
    }
  ]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 3500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error', response.status, await response.text().catch(() => ''));
      return NextResponse.json({ error: 'AI analysis failed.' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '{}';
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: 'Could not parse AI response.' }, { status: 500 });

    try {
      const parsed = JSON.parse(match[0]);
      return NextResponse.json({
        result: parsed,
        lowerCount: lowerDocs.length,
        higherCount: higherDocs.length,
        analyzedAt: new Date().toISOString(),
      });
    } catch {
      return NextResponse.json({ error: 'Invalid JSON from AI.' }, { status: 500 });
    }
  } catch (err) {
    console.error('alignment POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
