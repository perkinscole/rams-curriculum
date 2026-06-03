import { notFound } from 'next/navigation';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { CurriculumDoc, parseStage, Stage1, Stage2, Stage3 } from '@/lib/types';
import AutoPrint from '@/app/docs/[id]/print/AutoPrint';

interface SearchParams {
  audience?: string;
  reviewer?: string;
  mission?: string;
}

interface FrameworkCoverage {
  framework_id: string;
  framework_name: string;
  framework_state: string | null;
  subject: string;
  grade_band: string;
  total_standards: number;
  standards_with_evidence: number;
  standards_with_strong_coverage: number;
  units_analyzed: number;
}

const emptyStage1: Stage1 = { learning_standards: '', vog_outcomes: '', transfer: '', enduring_understandings: '', essential_questions: '', knowledge: '', skills: '' };
const emptyStage2: Stage2 = { transfer_tasks: '', formative_assessments: '', summative_assessments: '', other_evidence: '' };
const emptyStage3: Stage3 = { learning_events: '', resources_materials: '', differentiation: '' };

function Field({ label, value, small }: { label: string; value: string; small?: boolean }) {
  if (!value) return null;
  return (
    <div className="mb-2 break-inside-avoid">
      <h5 className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">{label}</h5>
      <p className={`text-slate-800 whitespace-pre-wrap leading-snug ${small ? 'text-xs' : 'text-sm'}`}>{value}</p>
    </div>
  );
}

export default async function AccreditationReportPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') notFound();

  const sp = await searchParams;
  const audience = sp.audience || '';
  const reviewer = sp.reviewer || '';
  const mission = sp.mission || '';

  const district = await queryOne<{ id: string; name: string; slug: string }>(
    `SELECT id, name, slug FROM districts WHERE id = $1`,
    [session.districtId]
  );
  if (!district) notFound();

  // Counts and rollups
  const counts = await queryOne<{
    total: string; approved: string; pending: string; revision: string; draft: string;
    subjects: string;
  }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE status = 'approved')::text AS approved,
       COUNT(*) FILTER (WHERE status = 'submitted')::text AS pending,
       COUNT(*) FILTER (WHERE status = 'revision_requested')::text AS revision,
       COUNT(*) FILTER (WHERE status = 'draft')::text AS draft,
       COUNT(DISTINCT subject_area) FILTER (WHERE status = 'approved')::text AS subjects
     FROM curriculum_docs WHERE district_id = $1`,
    [district.id]
  );

  // Faculty
  const teachers = await query<{
    id: string; name: string; email: string; department: string; role: string; unit_count: string;
  }>(
    `SELECT u.id, u.name, u.email, u.department, u.role,
       (SELECT COUNT(*) FROM curriculum_docs d
        WHERE d.teacher_id = u.id AND d.district_id = u.district_id)::text AS unit_count
     FROM users u
     WHERE u.district_id = $1
     ORDER BY u.role DESC, u.name ASC`,
    [district.id]
  );

  // All approved units, full content, for inventory + sample appendix
  const approvedDocs = await query<CurriculumDoc & { teacher_name: string }>(
    `SELECT d.*, u.name AS teacher_name
     FROM curriculum_docs d JOIN users u ON d.teacher_id = u.id
     WHERE d.district_id = $1 AND d.status = 'approved'
     ORDER BY d.subject_area, d.grade, d.unit_title`,
    [district.id]
  );

  // Standards coverage rollup per framework
  const frameworkCoverage = await query<FrameworkCoverage>(
    `SELECT
       f.id AS framework_id,
       f.name AS framework_name,
       f.state AS framework_state,
       f.subject,
       f.grade_band,
       (SELECT COUNT(*) FROM standards s WHERE s.framework_id = f.id)::int AS total_standards,
       (SELECT COUNT(DISTINCT c.standard_id)
          FROM doc_standards_coverage c
          WHERE c.framework_id = f.id AND c.district_id = $1 AND c.depth >= 1)::int AS standards_with_evidence,
       (SELECT COUNT(DISTINCT c.standard_id)
          FROM doc_standards_coverage c
          WHERE c.framework_id = f.id AND c.district_id = $1 AND c.depth >= 2)::int AS standards_with_strong_coverage,
       (SELECT COUNT(DISTINCT c.doc_id)
          FROM doc_standards_coverage c
          WHERE c.framework_id = f.id AND c.district_id = $1)::int AS units_analyzed
     FROM standards_frameworks f
     JOIN district_frameworks df ON df.framework_id = f.id
     WHERE df.district_id = $1
     ORDER BY f.subject, f.name`,
    [district.id]
  );

  // Group approved docs by subject for inventory
  const docsBySubject: Record<string, typeof approvedDocs> = {};
  for (const d of approvedDocs) {
    if (!docsBySubject[d.subject_area]) docsBySubject[d.subject_area] = [];
    docsBySubject[d.subject_area].push(d);
  }
  const subjects = Object.keys(docsBySubject).sort();

  // Pick 3 sample units for the appendix — prefer varied subjects and high stage completeness
  const samples = approvedDocs
    .map(d => ({ d, score: (d.stage1_complete ? 1 : 0) + (d.stage2_complete ? 1 : 0) + (d.stage3_complete ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.d);
  const sampleSubjectsSeen = new Set<string>();
  const sampleUnits: typeof approvedDocs = [];
  for (const d of samples) {
    if (sampleSubjectsSeen.has(d.subject_area)) continue;
    sampleSubjectsSeen.add(d.subject_area);
    sampleUnits.push(d);
    if (sampleUnits.length >= 3) break;
  }
  // Fill with any remaining if not enough subjects
  for (const d of samples) {
    if (sampleUnits.length >= 3) break;
    if (!sampleUnits.includes(d)) sampleUnits.push(d);
  }

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="bg-white text-slate-900">
      <AutoPrint />

      <div className="max-w-4xl mx-auto px-10 py-12 print:py-6 print:px-8">

        {/* COVER */}
        <div className="min-h-[88vh] flex flex-col break-after-page">
          <div className="flex-1 flex flex-col justify-center text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-4">Curriculum Accreditation Report</p>
            <h1 className="text-5xl font-bold mb-4 leading-tight">{district.name}</h1>
            <p className="text-slate-600 text-lg mb-12">{today}</p>

            {audience && (
              <div className="mt-8">
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Prepared for</p>
                <p className="text-slate-800 font-medium">{audience}</p>
              </div>
            )}
            {reviewer && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Prepared by</p>
                <p className="text-slate-800 font-medium">{reviewer}</p>
              </div>
            )}
            {mission && (
              <div className="mt-12 max-w-2xl mx-auto">
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">District Mission</p>
                <p className="italic text-slate-700 leading-relaxed">&ldquo;{mission}&rdquo;</p>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 text-center pt-6">Generated by Curriclio &middot; curriclio.app</p>
        </div>

        {/* EXECUTIVE SUMMARY */}
        <section className="mb-10 break-after-page">
          <h2 className="text-2xl font-bold border-b-2 border-slate-900 pb-2 mb-6">1 &nbsp; Executive Summary</h2>

          <p className="text-slate-700 mb-6 leading-relaxed">
            This report summarizes {district.name}&rsquo;s documented curriculum as of {today}. All units use the
            Understanding by Design (UBD) framework, with three stages of planning: Desired Results, Evidence
            of Learning, and Learning Plan. Each unit is authored by a member of the faculty and approved by
            the district&rsquo;s curriculum office.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-slate-300 rounded p-4">
              <p className="text-3xl font-bold text-slate-900">{counts?.approved || 0}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500 mt-1">Approved units in current cycle</p>
            </div>
            <div className="border border-slate-300 rounded p-4">
              <p className="text-3xl font-bold text-slate-900">{subjects.length}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500 mt-1">Subject areas with approved curriculum</p>
            </div>
            <div className="border border-slate-300 rounded p-4">
              <p className="text-3xl font-bold text-slate-900">{teachers.filter(t => t.role === 'teacher').length}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500 mt-1">Teachers contributing</p>
            </div>
            <div className="border border-slate-300 rounded p-4">
              <p className="text-3xl font-bold text-slate-900">{frameworkCoverage.length}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500 mt-1">Standards frameworks tracked</p>
            </div>
          </div>

          <table className="w-full text-sm border border-slate-300 mb-4">
            <thead className="bg-slate-100 border-b border-slate-300 text-xs uppercase">
              <tr><th className="text-left p-2">Status</th><th className="text-right p-2">Count</th></tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200"><td className="p-2">Approved</td><td className="text-right p-2 font-medium">{counts?.approved || 0}</td></tr>
              <tr className="border-b border-slate-200"><td className="p-2">Pending review</td><td className="text-right p-2 font-medium">{counts?.pending || 0}</td></tr>
              <tr className="border-b border-slate-200"><td className="p-2">In revision</td><td className="text-right p-2 font-medium">{counts?.revision || 0}</td></tr>
              <tr><td className="p-2">Draft</td><td className="text-right p-2 font-medium">{counts?.draft || 0}</td></tr>
            </tbody>
          </table>

          <p className="text-xs text-slate-500 italic">
            All units in this report have completed full administrative review and are approved for instructional use.
          </p>
        </section>

        {/* STANDARDS COVERAGE */}
        <section className="mb-10 break-after-page">
          <h2 className="text-2xl font-bold border-b-2 border-slate-900 pb-2 mb-6">2 &nbsp; Standards Alignment</h2>

          {frameworkCoverage.length === 0 ? (
            <p className="text-slate-600 italic">No standards frameworks have been enabled for this district. Enable frameworks in <strong>Standards Coverage</strong> and run analysis before generating this section.</p>
          ) : (
            <>
              <p className="text-slate-700 mb-6 leading-relaxed">
                The district uses AI-assisted standards-coverage analysis to map every approved unit against
                its adopted learning standards frameworks. The table below summarizes coverage by framework.
                Depth is scored from 1 (mentioned) to 3 (mastered) by the analysis; standards at depth 2 or
                higher are considered to have substantive coverage.
              </p>

              <table className="w-full text-sm border border-slate-300 mb-6">
                <thead className="bg-slate-100 border-b border-slate-300 text-xs uppercase">
                  <tr>
                    <th className="text-left p-2">Framework</th>
                    <th className="text-right p-2">Standards</th>
                    <th className="text-right p-2">Substantive coverage</th>
                    <th className="text-right p-2">Coverage %</th>
                    <th className="text-right p-2">Units analyzed</th>
                  </tr>
                </thead>
                <tbody>
                  {frameworkCoverage.map(fc => {
                    const pct = fc.total_standards > 0
                      ? Math.round((fc.standards_with_strong_coverage / fc.total_standards) * 100)
                      : 0;
                    return (
                      <tr key={fc.framework_id} className="border-b border-slate-200">
                        <td className="p-2">
                          <p className="font-medium">{fc.framework_name}</p>
                          <p className="text-xs text-slate-500">{fc.subject} &middot; Grades {fc.grade_band}{fc.framework_state ? ` · ${fc.framework_state}` : ''}</p>
                        </td>
                        <td className="text-right p-2">{fc.total_standards}</td>
                        <td className="text-right p-2">{fc.standards_with_strong_coverage}</td>
                        <td className="text-right p-2 font-medium">{pct}%</td>
                        <td className="text-right p-2">{fc.units_analyzed}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <p className="text-xs text-slate-500 italic">
                Coverage percentages reflect the proportion of standards in each framework with substantive
                evidence (depth ≥ 2) in at least one approved unit. Detailed per-standard reports are
                available in the Curriclio Standards Coverage dashboard.
              </p>
            </>
          )}
        </section>

        {/* CURRICULUM INVENTORY */}
        <section className="mb-10 break-after-page">
          <h2 className="text-2xl font-bold border-b-2 border-slate-900 pb-2 mb-6">3 &nbsp; Curriculum Inventory</h2>
          <p className="text-slate-700 mb-6 leading-relaxed">
            All approved units, grouped by subject and sorted by grade. Each unit was authored by a faculty
            member, peer-reviewed, and formally approved by the curriculum office.
          </p>

          {subjects.length === 0 ? (
            <p className="text-slate-600 italic">No approved units to inventory.</p>
          ) : subjects.map(subject => (
            <div key={subject} className="mb-6 break-inside-avoid">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{subject}</h3>
              <table className="w-full text-sm border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 text-xs uppercase">
                  <tr>
                    <th className="text-left p-2">Grade</th>
                    <th className="text-left p-2">Unit</th>
                    <th className="text-left p-2">Teacher</th>
                    <th className="text-left p-2">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {docsBySubject[subject].map(doc => (
                    <tr key={doc.id} className="border-b border-slate-200 align-top">
                      <td className="p-2 whitespace-nowrap">{doc.grade}</td>
                      <td className="p-2 font-medium">{doc.unit_title}</td>
                      <td className="p-2 text-slate-600 whitespace-nowrap">{doc.teacher_name}</td>
                      <td className="p-2 text-slate-600 text-xs">{doc.unit_summary?.slice(0, 200)}{(doc.unit_summary?.length || 0) > 200 ? '…' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>

        {/* FACULTY ROSTER */}
        <section className="mb-10 break-after-page">
          <h2 className="text-2xl font-bold border-b-2 border-slate-900 pb-2 mb-6">4 &nbsp; Faculty Roster</h2>
          <p className="text-slate-700 mb-6 leading-relaxed">
            Educators authoring or reviewing curriculum in {district.name}.
          </p>

          <table className="w-full text-sm border border-slate-300">
            <thead className="bg-slate-100 border-b border-slate-300 text-xs uppercase">
              <tr>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Department</th>
                <th className="text-right p-2">Units authored</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id} className="border-b border-slate-200">
                  <td className="p-2 font-medium">{t.name}</td>
                  <td className="p-2 capitalize">{t.role}</td>
                  <td className="p-2 text-slate-600">{t.department || '—'}</td>
                  <td className="p-2 text-right">{t.unit_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* SAMPLE UNITS */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold border-b-2 border-slate-900 pb-2 mb-2">5 &nbsp; Appendix: Sample Units</h2>
          <p className="text-slate-700 mb-6 leading-relaxed">
            Three approved units printed in full as evidence of planning depth and instructional design.
          </p>

          {sampleUnits.map((doc, idx) => {
            const s1 = parseStage<Stage1>(doc.stage1, emptyStage1);
            const s2 = parseStage<Stage2>(doc.stage2, emptyStage2);
            const s3 = parseStage<Stage3>(doc.stage3, emptyStage3);
            return (
              <div key={doc.id} className={`mb-8 ${idx < sampleUnits.length - 1 ? 'break-after-page' : ''}`}>
                <div className="border-b-2 border-slate-700 pb-2 mb-3">
                  <p className="text-xs uppercase tracking-widest text-slate-500">Sample {idx + 1} &middot; {doc.subject_area} &middot; Grade {doc.grade}</p>
                  <h3 className="text-xl font-bold mt-1">{doc.unit_title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{doc.teacher_name}{doc.course ? ` · ${doc.course}` : ''}</p>
                </div>

                {doc.unit_summary && <Field label="Unit Summary" value={doc.unit_summary} />}

                <h4 className="text-sm font-bold border-b border-slate-300 mt-4 mb-2">Stage 1 &mdash; Desired Results</h4>
                <Field label="Learning Standards" value={s1.learning_standards} small />
                <Field label="Vision of a Graduate Outcomes" value={s1.vog_outcomes} small />
                <Field label="Transfer" value={s1.transfer} small />
                <Field label="Enduring Understandings" value={s1.enduring_understandings} small />
                <Field label="Essential Questions" value={s1.essential_questions} small />
                <Field label="Knowledge" value={s1.knowledge} small />
                <Field label="Skills" value={s1.skills} small />

                <h4 className="text-sm font-bold border-b border-slate-300 mt-4 mb-2">Stage 2 &mdash; Evidence of Learning</h4>
                <Field label="Transfer / Performance Task(s)" value={s2.transfer_tasks} small />
                <Field label="Formative Assessment(s)" value={s2.formative_assessments} small />
                <Field label="Summative Assessment(s)" value={s2.summative_assessments} small />
                <Field label="Other Evidence" value={s2.other_evidence} small />

                <h4 className="text-sm font-bold border-b border-slate-300 mt-4 mb-2">Stage 3 &mdash; Learning Plan</h4>
                <Field label="Learning Events" value={s3.learning_events} small />
                <Field label="Resources &amp; Materials" value={s3.resources_materials} small />
                <Field label="Differentiation" value={s3.differentiation} small />
              </div>
            );
          })}
        </section>

        <div className="text-xs text-slate-400 text-center pt-6 border-t border-slate-200">
          Generated by Curriclio &middot; curriclio.app &middot; {today}
        </div>
      </div>
    </div>
  );
}
