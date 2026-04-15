'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CurriculumDoc, Stage1, Stage2, Stage3, SUBJECTS } from '@/lib/types';

export default function CurriculumBrowsePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <CurriculumBrowseContent />
    </Suspense>
  );
}

function CurriculumBrowseContent() {
  const searchParams = useSearchParams();
  const [docs, setDocs] = useState<CurriculumDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState(searchParams.get('subject') || '');
  const [filterGrade, setFilterGrade] = useState('');
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ public: 'true' });
    if (filterSubject) params.set('subject', filterSubject);
    if (filterGrade) params.set('grade', filterGrade);

    fetch(`/api/docs?${params}`)
      .then(r => r.json())
      .then(data => setDocs(data.docs || []))
      .finally(() => setLoading(false));
  }, [filterSubject, filterGrade]);

  // Group docs by subject
  const grouped: Record<string, CurriculumDoc[]> = {};
  docs.forEach(doc => {
    if (!grouped[doc.subject_area]) grouped[doc.subject_area] = [];
    grouped[doc.subject_area].push(doc);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">RAMS Curriculum</h1>
        <p className="text-gray-500 mt-1">Robert Adams Middle School &middot; Grades 6-8</p>
        <Link href="/curriculum/connections" className="inline-block mt-3 text-[#8B1A1A] font-medium hover:underline text-sm">
          View Curriculum Connections (AI) &rarr;
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 justify-center">
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">All Grades</option>
          <option value="6">Grade 6</option>
          <option value="7">Grade 7</option>
          <option value="8">Grade 8</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading curriculum...</div>
      ) : docs.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No approved curriculum documents yet.</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([subject, subjectDocs]) => (
            <div key={subject}>
              <h2 className="text-xl font-bold text-[#8B1A1A] mb-3 border-b-2 border-[#8B1A1A] pb-1">{subject}</h2>
              <div className="space-y-3">
                {subjectDocs.map(doc => {
                  const isExpanded = expandedDoc === doc.id;
                  const s1: Stage1 = JSON.parse(doc.stage1 || '{}');
                  const s2: Stage2 = JSON.parse(doc.stage2 || '{}');
                  const s3: Stage3 = JSON.parse(doc.stage3 || '{}');

                  return (
                    <div key={doc.id} className="bg-white rounded-lg shadow overflow-hidden">
                      <button
                        onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-800">{doc.unit_title}</h3>
                          <p className="text-sm text-gray-500">
                            Grade {doc.grade} &middot; {doc.teacher_name}
                            {doc.course && ` &middot; ${doc.course}`}
                            {doc.start_date && ` &middot; ${doc.start_date} to ${doc.end_date}`}
                          </p>
                        </div>
                        <span className="text-gray-400 text-xl">{isExpanded ? '\u25B2' : '\u25BC'}</span>
                      </button>

                      {isExpanded && (
                        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                          {doc.unit_summary && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-500 mb-1">Unit Summary</h4>
                              <p className="text-gray-700">{doc.unit_summary}</p>
                            </div>
                          )}

                          {/* Stage 1 */}
                          <div className="mb-4">
                            <h4 className="text-sm font-bold text-[#8B1A1A] mb-2 bg-red-50 px-3 py-1.5 rounded">Stage 1: Desired Results</h4>
                            <div className="grid md:grid-cols-2 gap-3 text-sm">
                              {s1.learning_standards && <div><span className="font-medium text-gray-500">Standards:</span><p className="text-gray-700 mt-0.5">{s1.learning_standards}</p></div>}
                              {s1.essential_questions && <div><span className="font-medium text-gray-500">Essential Questions:</span><p className="text-gray-700 mt-0.5">{s1.essential_questions}</p></div>}
                              {s1.enduring_understandings && <div><span className="font-medium text-gray-500">Enduring Understandings:</span><p className="text-gray-700 mt-0.5">{s1.enduring_understandings}</p></div>}
                              {s1.knowledge && <div><span className="font-medium text-gray-500">Knowledge:</span><p className="text-gray-700 mt-0.5">{s1.knowledge}</p></div>}
                              {s1.skills && <div><span className="font-medium text-gray-500">Skills:</span><p className="text-gray-700 mt-0.5">{s1.skills}</p></div>}
                              {s1.transfer && <div><span className="font-medium text-gray-500">Transfer:</span><p className="text-gray-700 mt-0.5">{s1.transfer}</p></div>}
                            </div>
                          </div>

                          {/* Stage 2 */}
                          <div className="mb-4">
                            <h4 className="text-sm font-bold text-[#8B1A1A] mb-2 bg-red-50 px-3 py-1.5 rounded">Stage 2: Evidence of Learning</h4>
                            <div className="grid md:grid-cols-2 gap-3 text-sm">
                              {s2.transfer_tasks && <div><span className="font-medium text-gray-500">Transfer/Performance Tasks:</span><p className="text-gray-700 mt-0.5">{s2.transfer_tasks}</p></div>}
                              {s2.formative_assessments && <div><span className="font-medium text-gray-500">Formative Assessments:</span><p className="text-gray-700 mt-0.5">{s2.formative_assessments}</p></div>}
                              {s2.summative_assessments && <div><span className="font-medium text-gray-500">Summative Assessments:</span><p className="text-gray-700 mt-0.5">{s2.summative_assessments}</p></div>}
                              {s2.other_evidence && <div><span className="font-medium text-gray-500">Other Evidence:</span><p className="text-gray-700 mt-0.5">{s2.other_evidence}</p></div>}
                            </div>
                          </div>

                          {/* Stage 3 */}
                          <div>
                            <h4 className="text-sm font-bold text-[#8B1A1A] mb-2 bg-red-50 px-3 py-1.5 rounded">Stage 3: Learning Plan</h4>
                            <div className="grid md:grid-cols-2 gap-3 text-sm">
                              {s3.learning_events && <div><span className="font-medium text-gray-500">Learning Events:</span><p className="text-gray-700 mt-0.5">{s3.learning_events}</p></div>}
                              {s3.resources_materials && <div><span className="font-medium text-gray-500">Resources & Materials:</span><p className="text-gray-700 mt-0.5">{s3.resources_materials}</p></div>}
                              {s3.differentiation && <div><span className="font-medium text-gray-500">Differentiation:</span><p className="text-gray-700 mt-0.5">{s3.differentiation}</p></div>}
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
