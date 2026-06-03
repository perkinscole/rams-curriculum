import { notFound } from 'next/navigation';
import { query, queryOne } from '@/lib/db';
import { CurriculumDoc, parseStage, Stage1, Stage2, Stage3 } from '@/lib/types';
import AutoPrint from '../../docs/[id]/print/AutoPrint';

const emptyStage1: Stage1 = { learning_standards: '', vog_outcomes: '', transfer: '', enduring_understandings: '', essential_questions: '', knowledge: '', skills: '' };
const emptyStage2: Stage2 = { transfer_tasks: '', formative_assessments: '', summative_assessments: '', other_evidence: '' };
const emptyStage3: Stage3 = { learning_events: '', resources_materials: '', differentiation: '' };

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="mb-2 break-inside-avoid">
      <h4 className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">{label}</h4>
      <p className="text-slate-800 whitespace-pre-wrap leading-snug text-sm">{value}</p>
    </div>
  );
}

interface SearchParams {
  district?: string;
  subject?: string;
  grade?: string;
}

export default async function BinderPrintPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const districtSlug = sp.district;
  if (!districtSlug) notFound();

  const district = await queryOne<{ id: string; name: string }>(
    `SELECT id, name FROM districts WHERE slug = $1`,
    [districtSlug]
  );
  if (!district) notFound();

  const params: unknown[] = [district.id];
  let sql = `
    SELECT d.*, u.name AS teacher_name
    FROM curriculum_docs d JOIN users u ON d.teacher_id = u.id
    WHERE d.district_id = $1 AND d.status = 'approved'
  `;
  let i = 2;
  if (sp.subject) { sql += ` AND d.subject_area = $${i++}`; params.push(sp.subject); }
  if (sp.grade) { sql += ` AND d.grade = $${i++}`; params.push(sp.grade); }
  sql += ` ORDER BY d.subject_area, d.grade, d.unit_title`;

  const docs = await query<CurriculumDoc & { teacher_name: string }>(sql, params);

  return (
    <div className="bg-white text-slate-900">
      <AutoPrint />

      <div className="max-w-4xl mx-auto px-8 py-10 print:py-4 print:px-6">
        <div className="text-center mb-10 break-after-page">
          <p className="text-xs uppercase tracking-widest text-slate-500">{district.name}</p>
          <h1 className="text-4xl font-bold mt-2">Curriculum Binder</h1>
          <p className="text-slate-600 mt-2">{docs.length} approved unit{docs.length !== 1 ? 's' : ''}</p>
          {sp.subject && <p className="text-slate-500 mt-1 text-sm">Filtered by subject: {sp.subject}</p>}
          {sp.grade && <p className="text-slate-500 mt-1 text-sm">Filtered by grade: {sp.grade}</p>}
          <p className="text-xs text-slate-400 mt-8">Generated {new Date().toLocaleDateString()} via Curriclio</p>
        </div>

        {docs.length === 0 ? (
          <p className="text-center text-slate-500">No approved units to print.</p>
        ) : docs.map((doc, idx) => {
          const s1 = parseStage<Stage1>(doc.stage1, emptyStage1);
          const s2 = parseStage<Stage2>(doc.stage2, emptyStage2);
          const s3 = parseStage<Stage3>(doc.stage3, emptyStage3);
          return (
            <div key={doc.id} className={`mb-10 ${idx < docs.length - 1 ? 'break-after-page' : ''}`}>
              <div className="border-b-2 border-slate-900 pb-3 mb-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">{doc.subject_area} &middot; Grade {doc.grade}</p>
                <h2 className="text-2xl font-bold mt-1">{doc.unit_title}</h2>
                <p className="text-sm text-slate-600 mt-1">
                  {doc.teacher_name}
                  {doc.course && ` · ${doc.course}`}
                  {doc.start_date && ` · ${doc.start_date} to ${doc.end_date}`}
                </p>
              </div>

              {doc.unit_summary && <Field label="Unit Summary" value={doc.unit_summary} />}

              <section className="mt-4 mb-4">
                <h3 className="text-base font-bold border-b border-slate-300 pb-1 mb-2">Stage 1 &mdash; Desired Results</h3>
                <Field label="Learning Standards" value={s1.learning_standards} />
                <Field label="Vision of a Graduate Outcomes" value={s1.vog_outcomes} />
                <Field label="Transfer" value={s1.transfer} />
                <Field label="Enduring Understandings" value={s1.enduring_understandings} />
                <Field label="Essential Questions" value={s1.essential_questions} />
                <Field label="Knowledge" value={s1.knowledge} />
                <Field label="Skills" value={s1.skills} />
              </section>

              <section className="mb-4">
                <h3 className="text-base font-bold border-b border-slate-300 pb-1 mb-2">Stage 2 &mdash; Evidence</h3>
                <Field label="Transfer / Performance Tasks" value={s2.transfer_tasks} />
                <Field label="Formative Assessments" value={s2.formative_assessments} />
                <Field label="Summative Assessments" value={s2.summative_assessments} />
                <Field label="Other Evidence" value={s2.other_evidence} />
              </section>

              <section className="mb-4">
                <h3 className="text-base font-bold border-b border-slate-300 pb-1 mb-2">Stage 3 &mdash; Learning Plan</h3>
                <Field label="Learning Events" value={s3.learning_events} />
                <Field label="Resources &amp; Materials" value={s3.resources_materials} />
                <Field label="Differentiation" value={s3.differentiation} />
              </section>
            </div>
          );
        })}

        <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-200">
          Generated by Curriclio &middot; curriclio.app
        </div>
      </div>
    </div>
  );
}
