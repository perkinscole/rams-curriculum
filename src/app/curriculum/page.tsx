'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CurriculumDoc, District, Stage1, Stage2, Stage3, parseStage } from '@/lib/types';

export default function CurriculumBrowsePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <CurriculumBrowseContent />
    </Suspense>
  );
}

function CurriculumBrowseContent() {
  const searchParams = useSearchParams();
  const districtSlug = searchParams.get('district');
  const [district, setDistrict] = useState<District | null>(null);
  const [docs, setDocs] = useState<CurriculumDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState(searchParams.get('subject') || '');
  const [filterGrade, setFilterGrade] = useState('');
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null);

  useEffect(() => {
    const url = districtSlug ? `/api/district?slug=${encodeURIComponent(districtSlug)}` : '/api/district';
    fetch(url).then(r => r.json()).then(data => setDistrict(data.district || null));
  }, [districtSlug]);

  useEffect(() => {
    if (!districtSlug && !district) return;
    const params = new URLSearchParams({ public: 'true' });
    if (districtSlug) params.set('district', districtSlug);
    else if (district) params.set('district', district.slug);
    if (filterSubject) params.set('subject', filterSubject);
    if (filterGrade) params.set('grade', filterGrade);

    fetch(`/api/docs?${params}`)
      .then(r => r.json())
      .then(data => setDocs(data.docs || []))
      .finally(() => setLoading(false));
  }, [filterSubject, filterGrade, districtSlug, district]);

  if (!districtSlug && !district) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Browse Curriculum</h1>
        <p className="text-slate-500">Sign in or open a district&rsquo;s public curriculum link to browse approved units.</p>
      </div>
    );
  }

  const grouped: Record<string, CurriculumDoc[]> = {};
  docs.forEach(doc => {
    if (!grouped[doc.subject_area]) grouped[doc.subject_area] = [];
    grouped[doc.subject_area].push(doc);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">{district?.name || 'Curriculum'}</h1>
        <p className="text-slate-500 mt-1">Approved curriculum units</p>
        <Link
          href={`/curriculum/connections${district ? `?district=${district.slug}` : ''}`}
          className="inline-block mt-3 text-indigo-600 font-medium hover:underline text-sm"
        >
          View Curriculum Connections (AI) &rarr;
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 justify-center">
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All Subjects</option>
          {(district?.subjects || []).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All Grades</option>
          {(district?.grades || []).map(g => <option key={g} value={g}>Grade {g}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading curriculum...</div>
      ) : docs.length === 0 ? (
        <div className="text-center text-slate-400 py-12">No approved curriculum documents yet.</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([subject, subjectDocs]) => (
            <div key={subject}>
              <h2 className="text-xl font-bold text-indigo-700 mb-3 border-b-2 border-indigo-500 pb-1">{subject}</h2>
              <div className="space-y-3">
                {subjectDocs.map(doc => {
                  const isExpanded = expandedDoc === doc.id;
                  const s1 = parseStage<Stage1>(doc.stage1, {
                    learning_standards: '', vog_outcomes: '', transfer: '', enduring_understandings: '',
                    essential_questions: '', knowledge: '', skills: '',
                  });
                  const s2 = parseStage<Stage2>(doc.stage2, {
                    transfer_tasks: '', formative_assessments: '', summative_assessments: '', other_evidence: '',
                  });
                  const s3 = parseStage<Stage3>(doc.stage3, {
                    learning_events: '', resources_materials: '', differentiation: '',
                  });

                  return (
                    <div key={doc.id} className="bg-white rounded-lg shadow overflow-hidden">
                      <button
                        onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
                      >
                        <div>
                          <h3 className="font-semibold text-slate-800">{doc.unit_title}</h3>
                          <p className="text-sm text-slate-500">
                            Grade {doc.grade} &middot; {doc.teacher_name}
                            {doc.course && ` · ${doc.course}`}
                            {doc.start_date && ` · ${doc.start_date} to ${doc.end_date}`}
                          </p>
                        </div>
                        <span className="text-slate-400 text-xl">{isExpanded ? '▲' : '▼'}</span>
                      </button>

                      {isExpanded && (
                        <div className="px-6 pb-6 border-t border-slate-100 pt-4">
                          {doc.unit_summary && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-slate-500 mb-1">Unit Summary</h4>
                              <p className="text-slate-700">{doc.unit_summary}</p>
                            </div>
                          )}

                          <div className="mb-4">
                            <h4 className="text-sm font-bold text-indigo-700 mb-2 bg-indigo-50 px-3 py-1.5 rounded">Stage 1: Desired Results</h4>
                            <div className="grid md:grid-cols-2 gap-3 text-sm">
                              {s1.learning_standards && <div><span className="font-medium text-slate-500">Standards:</span><p className="text-slate-700 mt-0.5">{s1.learning_standards}</p></div>}
                              {s1.essential_questions && <div><span className="font-medium text-slate-500">Essential Questions:</span><p className="text-slate-700 mt-0.5">{s1.essential_questions}</p></div>}
                              {s1.enduring_understandings && <div><span className="font-medium text-slate-500">Enduring Understandings:</span><p className="text-slate-700 mt-0.5">{s1.enduring_understandings}</p></div>}
                              {s1.knowledge && <div><span className="font-medium text-slate-500">Knowledge:</span><p className="text-slate-700 mt-0.5">{s1.knowledge}</p></div>}
                              {s1.skills && <div><span className="font-medium text-slate-500">Skills:</span><p className="text-slate-700 mt-0.5">{s1.skills}</p></div>}
                              {s1.transfer && <div><span className="font-medium text-slate-500">Transfer:</span><p className="text-slate-700 mt-0.5">{s1.transfer}</p></div>}
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="text-sm font-bold text-indigo-700 mb-2 bg-indigo-50 px-3 py-1.5 rounded">Stage 2: Evidence of Learning</h4>
                            <div className="grid md:grid-cols-2 gap-3 text-sm">
                              {s2.transfer_tasks && <div><span className="font-medium text-slate-500">Transfer/Performance Tasks:</span><p className="text-slate-700 mt-0.5">{s2.transfer_tasks}</p></div>}
                              {s2.formative_assessments && <div><span className="font-medium text-slate-500">Formative Assessments:</span><p className="text-slate-700 mt-0.5">{s2.formative_assessments}</p></div>}
                              {s2.summative_assessments && <div><span className="font-medium text-slate-500">Summative Assessments:</span><p className="text-slate-700 mt-0.5">{s2.summative_assessments}</p></div>}
                              {s2.other_evidence && <div><span className="font-medium text-slate-500">Other Evidence:</span><p className="text-slate-700 mt-0.5">{s2.other_evidence}</p></div>}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-indigo-700 mb-2 bg-indigo-50 px-3 py-1.5 rounded">Stage 3: Learning Plan</h4>
                            <div className="grid md:grid-cols-2 gap-3 text-sm">
                              {s3.learning_events && <div><span className="font-medium text-slate-500">Learning Events:</span><p className="text-slate-700 mt-0.5">{s3.learning_events}</p></div>}
                              {s3.resources_materials && <div><span className="font-medium text-slate-500">Resources & Materials:</span><p className="text-slate-700 mt-0.5">{s3.resources_materials}</p></div>}
                              {s3.differentiation && <div><span className="font-medium text-slate-500">Differentiation:</span><p className="text-slate-700 mt-0.5">{s3.differentiation}</p></div>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
