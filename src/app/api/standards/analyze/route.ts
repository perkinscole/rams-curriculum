import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { CurriculumDoc, parseStage, Stage1, Stage2, Stage3 } from '@/lib/types';

interface StandardRow {
  id: string;
  code: string;
  description: string;
  grade: string;
  domain: string;
}

interface FrameworkRow {
  id: string;
  name: string;
  subject: string;
  grade_band: string;
}

interface CoverageItem {
  code: string;
  depth: 0 | 1 | 2 | 3;
  rationale: string;
}

function docContext(doc: CurriculumDoc): string {
  const s1 = parseStage<Stage1>(doc.stage1, { learning_standards: '', vog_outcomes: '', transfer: '', enduring_understandings: '', essential_questions: '', knowledge: '', skills: '' });
  const s2 = parseStage<Stage2>(doc.stage2, { transfer_tasks: '', formative_assessments: '', summative_assessments: '', other_evidence: '' });
  const s3 = parseStage<Stage3>(doc.stage3, { learning_events: '', resources_materials: '', differentiation: '' });

  return `
UNIT: ${doc.unit_title}
SUBJECT: ${doc.subject_area} | GRADE: ${doc.grade}
SUMMARY: ${doc.unit_summary}

STAGE 1 — DESIRED RESULTS
Learning Standards (teacher's own notes): ${s1.learning_standards}
Transfer: ${s1.transfer}
Enduring Understandings: ${s1.enduring_understandings}
Essential Questions: ${s1.essential_questions}
Knowledge: ${s1.knowledge}
Skills: ${s1.skills}

STAGE 2 — EVIDENCE
Transfer Tasks: ${s2.transfer_tasks}
Formative: ${s2.formative_assessments}
Summative: ${s2.summative_assessments}
Other Evidence: ${s2.other_evidence}

STAGE 3 — LEARNING PLAN
Learning Events: ${s3.learning_events}
Resources: ${s3.resources_materials}
Differentiation: ${s3.differentiation}
`.trim();
}

async function analyzeOneDoc(
  doc: CurriculumDoc,
  framework: FrameworkRow,
  standards: StandardRow[],
  apiKey: string
): Promise<CoverageItem[]> {
  const standardsList = standards
    .map(s => `${s.code} (${s.domain || 'general'}): ${s.description}`)
    .join('\n');

  const prompt = `You are a curriculum specialist evaluating standards coverage for a unit plan against the "${framework.name}" framework.

For each standard below, judge how deeply the unit addresses it on this scale:
  0 = not addressed at all
  1 = mentioned/touched briefly
  2 = addressed substantially through specific learning activities or assessments
  3 = a primary focus of the unit, with explicit instruction and assessment

Be precise. Only assign 2 or 3 if there is concrete evidence in the unit (specific activities, assessments, or learning targets that align). When the teacher's "Learning Standards" field already lists a code matching one of these standards, that's strong evidence but check whether the unit's actual content backs it up.

STANDARDS:
${standardsList}

UNIT:
${docContext(doc)}

Respond with ONLY valid JSON in this format:
{
  "coverage": [
    {"code": "RL.6.1", "depth": 2, "rationale": "One sentence explaining the evidence (or why depth is 0)."}
  ]
}
Include every standard above in your response, even depth 0 ones.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API ${response.status}`);
  }
  const data = await response.json();
  const content = data.content[0]?.text || '{}';
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed.coverage) ? parsed.coverage : [];
  } catch {
    return [];
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
      return NextResponse.json(
        { error: 'AI analysis requires ANTHROPIC_API_KEY to be set on this deployment.' },
        { status: 400 }
      );
    }

    const { frameworkId } = await request.json();
    if (!frameworkId) return NextResponse.json({ error: 'frameworkId required' }, { status: 400 });

    const framework = await queryOne<FrameworkRow>(
      `SELECT id, name, subject, grade_band FROM standards_frameworks WHERE id = $1`,
      [frameworkId]
    );
    if (!framework) return NextResponse.json({ error: 'Framework not found' }, { status: 404 });

    const standards = await query<StandardRow>(
      `SELECT id, code, description, grade, domain FROM standards WHERE framework_id = $1 ORDER BY grade, code`,
      [frameworkId]
    );
    if (standards.length === 0) {
      return NextResponse.json({ error: 'This framework has no standards loaded yet.' }, { status: 400 });
    }
    const standardsByCode = new Map(standards.map(s => [s.code, s]));

    // Pull approved docs in the framework's subject. Grade matching: if the
    // framework's grade_band looks like "6-8" we constrain to grades in that range;
    // otherwise we just match by subject.
    const gradeRangeMatch = framework.grade_band.match(/^(\d+)-(\d+)$/);
    let docsSql = `SELECT * FROM curriculum_docs
                   WHERE district_id = $1 AND status = 'approved' AND subject_area = $2`;
    const params: unknown[] = [session.districtId, framework.subject];
    if (gradeRangeMatch) {
      const [, lo, hi] = gradeRangeMatch;
      docsSql += ` AND grade::text = ANY($3)`;
      const grades: string[] = [];
      for (let g = parseInt(lo); g <= parseInt(hi); g++) grades.push(String(g));
      params.push(grades);
    }
    const docs = await query<CurriculumDoc>(docsSql, params);

    if (docs.length === 0) {
      return NextResponse.json({
        analyzed: 0,
        message: `No approved ${framework.subject} units (grades ${framework.grade_band}) found to analyze.`,
      });
    }

    // Run analyses in small parallel batches to avoid rate-limit thrash
    const CONCURRENCY = 3;
    let analyzed = 0;
    for (let i = 0; i < docs.length; i += CONCURRENCY) {
      const batch = docs.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(async doc => {
        try {
          const coverage = await analyzeOneDoc(doc, framework, standards, apiKey);
          // Clear prior coverage for this doc/framework
          await query(
            `DELETE FROM doc_standards_coverage WHERE doc_id = $1 AND framework_id = $2`,
            [doc.id, framework.id]
          );
          for (const item of coverage) {
            const std = standardsByCode.get(item.code);
            if (!std) continue;
            const depth = Math.max(0, Math.min(3, Math.round(Number(item.depth) || 0)));
            await query(
              `INSERT INTO doc_standards_coverage
                 (district_id, doc_id, framework_id, standard_id, depth, rationale)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (doc_id, standard_id) DO UPDATE SET
                 depth = EXCLUDED.depth,
                 rationale = EXCLUDED.rationale,
                 analyzed_at = now()`,
              [session.districtId, doc.id, framework.id, std.id, depth, item.rationale || '']
            );
          }
          analyzed += 1;
        } catch (err) {
          console.error(`Analysis failed for doc ${doc.id}:`, err);
        }
      }));
    }

    return NextResponse.json({ analyzed, total: docs.length });
  } catch (err) {
    console.error('analyze POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
