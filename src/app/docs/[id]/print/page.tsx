import { notFound } from 'next/navigation';
import { queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { CurriculumDoc, parseStage, Stage1, Stage2, Stage3 } from '@/lib/types';
import AutoPrint from './AutoPrint';

const emptyStage1: Stage1 = { learning_standards: '', vog_outcomes: '', transfer: '', enduring_understandings: '', essential_questions: '', knowledge: '', skills: '' };
const emptyStage2: Stage2 = { transfer_tasks: '', formative_assessments: '', summative_assessments: '', other_evidence: '' };
const emptyStage3: Stage3 = { learning_events: '', resources_materials: '', differentiation: '' };

interface DocWithJoin extends CurriculumDoc {
  district_name: string;
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="mb-3 break-inside-avoid">
      <h4 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">{label}</h4>
      <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}

export default async function PrintDocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const docId = parseInt(id);
  const session = await getSession();

  const doc = await queryOne<DocWithJoin>(
    `SELECT d.*, u.name AS teacher_name, u.email AS teacher_email, dist.name AS district_name
     FROM curriculum_docs d
     JOIN users u ON d.teacher_id = u.id
     JOIN districts dist ON d.district_id = dist.id
     WHERE d.id = $1`,
    [docId]
  );

  if (!doc) notFound();

  // Approved docs are publicly viewable; others require a session in the doc's district.
  if (doc.status !== 'approved') {
    if (!session || Number(session.districtId) !== Number(doc.district_id)) {
      notFound();
    }
  }

  const s1 = parseStage<Stage1>(doc.stage1, emptyStage1);
  const s2 = parseStage<Stage2>(doc.stage2, emptyStage2);
  const s3 = parseStage<Stage3>(doc.stage3, emptyStage3);

  return (
    <div className="bg-white text-slate-900">
      <AutoPrint />

      <div className="max-w-4xl mx-auto px-8 py-10 print:py-4 print:px-6">
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <p className="text-xs uppercase tracking-widest text-slate-500">{doc.district_name}</p>
          <h1 className="text-3xl font-bold mt-1">{doc.unit_title}</h1>
          <p className="text-slate-600 mt-1">
            {doc.subject_area} &middot; Grade {doc.grade}
            {doc.course && ` · ${doc.course}`}
            {' '}&middot; {doc.teacher_name}
          </p>
          {(doc.start_date || doc.end_date) && (
            <p className="text-slate-500 text-sm mt-1">
              {doc.start_date || '?'} &mdash; {doc.end_date || '?'}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-2 capitalize">Status: {doc.status.replace('_', ' ')}</p>
        </div>

        {doc.unit_summary && (
          <div className="mb-6 break-inside-avoid">
            <Field label="Unit Summary" value={doc.unit_summary} />
          </div>
        )}

        <section className="mb-8 break-inside-avoid">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">Stage 1 &mdash; Desired Results</h2>
          <Field label="Learning Standards" value={s1.learning_standards} />
          <Field label="Vision of a Graduate Performance Outcome(s)" value={s1.vog_outcomes} />
          <Field label="Transfer — Students will be able to independently use their learning to…" value={s1.transfer} />
          <Field label="Enduring Understandings — Students will understand that…" value={s1.enduring_understandings} />
          <Field label="Essential Questions — Students will consider…" value={s1.essential_questions} />
          <Field label="Knowledge — Students will know…" value={s1.knowledge} />
          <Field label="Skills — Students will be skilled at…" value={s1.skills} />
        </section>

        <section className="mb-8 break-inside-avoid">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">Stage 2 &mdash; Evidence of Learning</h2>
          <Field label="Transfer / Performance Task(s)" value={s2.transfer_tasks} />
          <Field label="Formative Assessment(s)" value={s2.formative_assessments} />
          <Field label="Summative Assessment(s)" value={s2.summative_assessments} />
          <Field label="Other Evidence" value={s2.other_evidence} />
        </section>

        <section className="mb-8 break-inside-avoid">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">Stage 3 &mdash; Learning Plan</h2>
          <Field label="Learning Events &amp; Instruction" value={s3.learning_events} />
          <Field label="Resources &amp; Materials" value={s3.resources_materials} />
          <Field label="Differentiation / Social Emotional Access" value={s3.differentiation} />
        </section>

        <div className="text-xs text-slate-400 text-center pt-4 border-t border-slate-200">
          Generated by Curriclio &middot; curriclio.app
        </div>
      </div>
    </div>
  );
}
